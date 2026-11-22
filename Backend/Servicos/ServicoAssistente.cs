using System.Globalization;
using System.Text;
using System.Text.Json;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Assistente de IA: sugere presentes para a lista e monta um roteiro com brincadeiras.
/// Ele só sugere e não grava nada: o organizador escolhe as sugestões, e o frontend as salva pelas
/// rotas normais de presentes e da checklist, com as validações de sempre.
///
/// Cuidados:
/// - LGPD: a IA recebe só o tipo do evento, as respostas do questionário, o número de convidados e
///   os nomes dos presentes já cadastrados. Nunca recebe nomes, telefones ou e-mails de pessoas
///   (nem o nome do evento, que costuma ter o nome dos anfitriões).
/// - Custo: cada lista tem <see cref="LimiteGeracoes"/> gerações no total (a do evento, somando
///   presentes e roteiro, e a lista pessoal de cada formando). A geração é reservada com um UPDATE
///   condicionado antes da chamada e devolvida se a IA falhar.
/// - A resposta da IA passa pelas mesmas regras de tamanho e de valor da criação manual.
/// </summary>
public class ServicoAssistente(ContextoBanco banco, ClienteIa ia)
{
    public const int LimiteGeracoes = 3;

    private const int QuantidadePadrao = 10;
    private const int MinimoSugestoes = 5;
    private const int MaximoSugestoes = 20;
    private const decimal ValorMaximoPermitido = 100_000m;
    private const int MaximoObservacoes = 500;
    private const int MaximoCotasSugeridas = 20;
    private const int MaximoDuracaoHoras = 12;

    private const string MensagemIndisponivel =
        "O assistente não conseguiu responder agora. Tente de novo em alguns minutos; essa tentativa não foi contada.";

    private static readonly CultureInfo PtBr = new("pt-BR");
    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public async Task<Resultado<StatusAssistenteResposta>> ObterStatusAsync(int usuarioId, int eventoId, bool minhaLista)
    {
        var lista = await ResolverListaAsync(usuarioId, eventoId, minhaLista, Permissao.GerenciarEvento);
        if (!lista.Sucesso)
            return lista.Repassar<StatusAssistenteResposta>();

        return Resultado<StatusAssistenteResposta>.Ok(new StatusAssistenteResposta(
            ia.Configurado, Restantes(lista.Valor!), LimiteGeracoes));
    }

    public async Task<Resultado<SugestoesPresentesResposta>> SugerirPresentesAsync(
        int usuarioId, int eventoId, SugerirPresentesRequisicao requisicao)
    {
        var minhaLista = requisicao.MinhaLista ?? false;
        var acesso = await ResolverListaAsync(usuarioId, eventoId, minhaLista, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<SugestoesPresentesResposta>();
        var lista = acesso.Valor!;

        var quantidade = requisicao.Quantidade ?? QuantidadePadrao;
        var observacoes = TextoOpcional(requisicao.Observacoes);
        var estilos = (requisicao.Estilos ?? []).Distinct().ToList();
        var erros = new Dictionary<string, string[]>();

        if (requisicao.ValorMinimo is < 0 or > ValorMaximoPermitido)
            erros["valorMinimo"] = ["Informe um valor mínimo válido."];
        if (requisicao.ValorMaximo is <= 0 or > ValorMaximoPermitido)
            erros["valorMaximo"] = ["Informe um valor máximo válido."];
        if (requisicao.ValorMinimo is decimal minimo && requisicao.ValorMaximo is decimal maximo && minimo > maximo)
            erros["valorMaximo"] = ["O valor máximo precisa ser maior que o mínimo."];
        if (quantidade is < MinimoSugestoes or > MaximoSugestoes)
            erros["quantidade"] = [$"Peça de {MinimoSugestoes} a {MaximoSugestoes} sugestões."];
        if (estilos.Any(e => !Enum.IsDefined(e)))
            erros["estilos"] = ["Estilo de presente inválido."];
        if (observacoes?.Length > MaximoObservacoes)
            erros["observacoes"] = [$"Use no máximo {MaximoObservacoes} caracteres."];

        if (erros.Count > 0)
            return Resultado<SugestoesPresentesResposta>.Invalido(erros);

        // Nomes da lista atual, para a IA não repetir (e para filtrar se ela repetir mesmo assim)
        var existentes = await banco.ItensPresente
            .Where(p => p.EventoId == eventoId && p.FormandoId == lista.FormandoId)
            .OrderBy(p => p.Nome)
            .Select(p => p.Nome)
            .ToListAsync();

        var pedido = new StringBuilder()
            .AppendLine($"Evento: {(minhaLista ? "formatura (lista pessoal de um formando)" : NomeTipo(lista.Evento.Tipo))}")
            .AppendLine($"Faixa de preço: {Faixa(requisicao.ValorMinimo, requisicao.ValorMaximo)}")
            .AppendLine($"Estilos: {(estilos.Count > 0 ? string.Join(", ", estilos.Select(NomeEstilo)) : "variados")}")
            .AppendLine($"Quantidade: {quantidade}");
        if (!minhaLista && await ContarConvidadosAsync(eventoId) is > 0 and var convidados)
            pedido.AppendLine($"Convidados: cerca de {convidados}");
        if (existentes.Count > 0)
            pedido.AppendLine($"Já na lista (não repita): {string.Join("; ", existentes.Take(60))}");
        if (observacoes is not null)
            pedido.AppendLine($"Observações do organizador: {observacoes}");

        var resposta = await GerarAsync<RespostaPresentesIa>(lista, InstrucoesPresentes, pedido.ToString(), EsquemaPresentes, 2500);
        if (!resposta.Sucesso)
            return resposta.Repassar<SugestoesPresentesResposta>();

        var nomesUsados = new HashSet<string>(existentes, StringComparer.OrdinalIgnoreCase);
        var sugestoes = new List<PresenteSugeridoResposta>();
        foreach (var item in resposta.Valor!.Presentes ?? [])
        {
            var nome = Cortar(item.Nome, 150);
            if (nome is null || !nomesUsados.Add(nome))
                continue;

            decimal? valor = item.Valor is > 0 and <= ValorMaximoPermitido ? Math.Round(item.Valor.Value, 2) : null;
            int? cotas = valor is not null && item.Cotas is >= 2 and <= MaximoCotasSugeridas ? item.Cotas : null;
            sugestoes.Add(new PresenteSugeridoResposta(nome, Cortar(item.Descricao, 300), valor, cotas));
        }

        if (sugestoes.Count == 0)
            return await DevolverGeracaoAsync<SugestoesPresentesResposta>(lista);

        return Resultado<SugestoesPresentesResposta>.Ok(
            new SugestoesPresentesResposta(sugestoes.Take(quantidade).ToList(), Restantes(lista)));
    }

    public async Task<Resultado<RoteiroResposta>> SugerirRoteiroAsync(
        int usuarioId, int eventoId, SugerirRoteiroRequisicao requisicao)
    {
        var acesso = await ResolverListaAsync(usuarioId, eventoId, minhaLista: false, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<RoteiroResposta>();
        var lista = acesso.Valor!;

        var duracao = requisicao.DuracaoHoras ?? 4;
        var observacoes = TextoOpcional(requisicao.Observacoes);
        var erros = new Dictionary<string, string[]>();

        if (!TimeOnly.TryParseExact(requisicao.HorarioInicio?.Trim(), "HH:mm", out var inicio))
            erros["horarioInicio"] = ["Informe o horário de início, ex.: 19:00."];
        if (duracao is < 1 or > MaximoDuracaoHoras)
            erros["duracaoHoras"] = [$"Informe uma duração de 1 a {MaximoDuracaoHoras} horas."];
        if (requisicao.Publico is PublicoEvento publico && !Enum.IsDefined(publico))
            erros["publico"] = ["Público inválido."];
        if (observacoes?.Length > MaximoObservacoes)
            erros["observacoes"] = [$"Use no máximo {MaximoObservacoes} caracteres."];

        if (erros.Count > 0)
            return Resultado<RoteiroResposta>.Invalido(erros);

        var pedido = new StringBuilder()
            .AppendLine($"Evento: {NomeTipo(lista.Evento.Tipo)}")
            .AppendLine($"Início: {inicio:HH\\:mm}; duração: {duracao} horas (termina por volta de {inicio.AddHours(duracao):HH\\:mm})")
            .AppendLine($"Público: {NomePublico(requisicao.Publico ?? PublicoEvento.Adultos)}");
        if (await ContarConvidadosAsync(eventoId) is > 0 and var convidados)
            pedido.AppendLine($"Convidados: cerca de {convidados}");
        if (observacoes is not null)
            pedido.AppendLine($"Observações do organizador: {observacoes}");

        var resposta = await GerarAsync<RespostaRoteiroIa>(lista, InstrucoesRoteiro, pedido.ToString(), EsquemaRoteiro, 2500);
        if (!resposta.Sucesso)
            return resposta.Repassar<RoteiroResposta>();

        var momentos = (resposta.Valor!.Momentos ?? [])
            .Select(m => (Valido: TimeOnly.TryParseExact(m.Horario?.Trim(), "HH:mm", out var horario), horario, m))
            .Where(m => m.Valido && Cortar(m.m.Titulo, 120) is not null)
            .Select(m => new MomentoRoteiroResposta(m.horario.ToString("HH\\:mm"), Cortar(m.m.Titulo, 120)!, Cortar(m.m.Descricao, 300)))
            .ToList();
        var brincadeiras = (resposta.Valor.Brincadeiras ?? [])
            .Where(b => Cortar(b.Titulo, 120) is not null)
            .Select(b => new BrincadeiraSugeridaResposta(Cortar(b.Titulo, 120)!, Cortar(b.Descricao, 300), Cortar(b.Materiais, 150)))
            .ToList();

        if (momentos.Count == 0 && brincadeiras.Count == 0)
            return await DevolverGeracaoAsync<RoteiroResposta>(lista);

        return Resultado<RoteiroResposta>.Ok(new RoteiroResposta(momentos, brincadeiras, Restantes(lista)));
    }

    /// <summary>
    /// Reserva uma geração, chama a IA e lê o JSON. Se a IA falhar, devolve a geração (não conta).
    /// </summary>
    private async Task<Resultado<T>> GerarAsync<T>(ListaAssistente lista, string instrucoes, string pedido, object esquema, int maximoTokens)
    {
        if (!ia.Configurado)
            return Resultado<T>.Falha(TipoErro.Indisponivel, "O assistente de IA não está configurado no servidor.");

        // UPDATE condicionado: dois pedidos ao mesmo tempo não passam do limite
        var reservou = lista.FormandoId is int formandoId
            ? await banco.Formandos
                .Where(f => f.Id == formandoId && f.GeracoesIa < LimiteGeracoes)
                .ExecuteUpdateAsync(s => s.SetProperty(f => f.GeracoesIa, f => f.GeracoesIa + 1))
            : await banco.Eventos
                .Where(e => e.Id == lista.Evento.Id && e.GeracoesIa < LimiteGeracoes)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.GeracoesIa, e => e.GeracoesIa + 1));
        if (reservou == 0)
            return Resultado<T>.Falha(
                TipoErro.Conflito, $"Você já usou as {LimiteGeracoes} sugestões do assistente disponíveis para esta lista.");
        lista.Usadas++;

        var json = await ia.GerarJsonAsync(instrucoes, pedido, esquema, maximoTokens);
        T? valor = default;
        if (json is not null)
        {
            try
            {
                valor = JsonSerializer.Deserialize<T>(json, OpcoesJson);
            }
            catch (JsonException)
            {
                valor = default;
            }
        }

        return valor is null ? await DevolverGeracaoAsync<T>(lista) : Resultado<T>.Ok(valor);
    }

    private async Task<Resultado<T>> DevolverGeracaoAsync<T>(ListaAssistente lista)
    {
        if (lista.FormandoId is int formandoId)
            await banco.Formandos
                .Where(f => f.Id == formandoId && f.GeracoesIa > 0)
                .ExecuteUpdateAsync(s => s.SetProperty(f => f.GeracoesIa, f => f.GeracoesIa - 1));
        else
            await banco.Eventos
                .Where(e => e.Id == lista.Evento.Id && e.GeracoesIa > 0)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.GeracoesIa, e => e.GeracoesIa - 1));
        lista.Usadas = Math.Max(0, lista.Usadas - 1);

        return Resultado<T>.Falha(TipoErro.Indisponivel, MensagemIndisponivel);
    }

    /// <summary>
    /// A lista do evento exige gerenciar o evento; a lista pessoal exige ser um formando que entrou por convite.
    /// </summary>
    private async Task<Resultado<ListaAssistente>> ResolverListaAsync(
        int usuarioId, int eventoId, bool minhaLista, Permissao permissaoListaEvento)
    {
        var acesso = await ControleAcesso.ExigirAsync(
            banco, usuarioId, eventoId, minhaLista ? Permissao.VerEvento : permissaoListaEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<ListaAssistente>();

        var evento = acesso.Valor!.Evento;
        if (!minhaLista)
            return Resultado<ListaAssistente>.Ok(new ListaAssistente(evento, null) { Usadas = evento.GeracoesIa });

        return acesso.Valor.Formando is { } formando
            ? Resultado<ListaAssistente>.Ok(new ListaAssistente(evento, formando.Id) { Usadas = formando.GeracoesIa })
            : Resultado<ListaAssistente>.Falha(
                TipoErro.Conflito, "Só formandos que entraram na turma por convite têm lista de presentes pessoal.");
    }

    private Task<int> ContarConvidadosAsync(int eventoId) =>
        banco.Convidados
            .Where(c => c.EventoId == eventoId && c.StatusPresenca != StatusPresenca.Recusado)
            .SumAsync(c => 1 + c.QuantidadeAcompanhantes);

    private static int Restantes(ListaAssistente lista) => Math.Max(0, LimiteGeracoes - lista.Usadas);

    private static string? Cortar(string? texto, int maximo)
    {
        var limpo = TextoOpcional(texto);
        return limpo is null ? null : limpo.Length <= maximo ? limpo : limpo[..maximo].TrimEnd();
    }

    private static string Faixa(decimal? minimo, decimal? maximo) => (minimo, maximo) switch
    {
        (decimal min, decimal max) => $"{min.ToString("C0", PtBr)} a {max.ToString("C0", PtBr)}",
        (decimal min, null) => $"a partir de {min.ToString("C0", PtBr)}",
        (null, decimal max) => $"até {max.ToString("C0", PtBr)}",
        _ => "livre",
    };

    private static string NomeTipo(TipoEvento tipo) => tipo switch
    {
        TipoEvento.ChaDePanela => "chá de panela",
        TipoEvento.Casamento => "casamento",
        TipoEvento.Aniversario => "aniversário",
        TipoEvento.Formatura => "formatura",
        _ => "evento",
    };

    private static string NomeEstilo(EstiloPresente estilo) => estilo switch
    {
        EstiloPresente.Cozinha => "cozinha",
        EstiloPresente.Casa => "casa e utilidades",
        EstiloPresente.Decoracao => "decoração",
        EstiloPresente.Tecnologia => "tecnologia",
        EstiloPresente.Experiencias => "experiências (viagens, passeios, cursos)",
        EstiloPresente.Pessoal => "uso pessoal (roupas, acessórios, beleza)",
        EstiloPresente.Lazer => "lazer (livros, jogos, esportes)",
        _ => estilo.ToString(),
    };

    private static string NomePublico(PublicoEvento publico) => publico switch
    {
        PublicoEvento.Adultos => "adultos",
        PublicoEvento.Familia => "famílias, com crianças",
        PublicoEvento.Jovens => "jovens",
        PublicoEvento.Criancas => "principalmente crianças",
        _ => "adultos",
    };

    // Instruções curtas: elas vão em toda chamada, e cada token conta no custo
    private const string InstrucoesPresentes = """
        Você sugere presentes para listas de presentes de eventos no Brasil. Responda só com o JSON pedido.
        - nome: curto e específico (até 60 caracteres), sem exigir marca.
        - descricao: uma frase de até 120 caracteres.
        - valor: preço médio no Brasil em reais, dentro da faixa pedida.
        - cotas: 0 para presente inteiro; de 2 a 10 só para presentes caros (acima de R$ 500) que os convidados possam dividir.
        - Não repita itens que já estão na lista. Varie as categorias dentro dos estilos pedidos.
        """;

    private const string InstrucoesRoteiro = """
        Você monta roteiros de eventos no Brasil. Responda só com o JSON pedido.
        - momentos: de 5 a 10 etapas em ordem, com horario no formato HH:MM dentro da duração do evento,
          titulo curto (até 60 caracteres) e descricao de uma frase.
        - brincadeiras: de 3 a 6 brincadeiras ou atividades adequadas ao tipo de evento e ao público,
          com titulo, descricao de como funciona (até 200 caracteres) e materiais (lista curta separada
          por vírgulas, ou texto vazio se não precisar).
        """;

    private static readonly object EsquemaPresentes = Objeto(new
    {
        presentes = new
        {
            type = "array",
            items = Objeto(new
            {
                nome = new { type = "string" },
                descricao = new { type = "string" },
                valor = new { type = "number" },
                cotas = new { type = "integer" },
            }),
        },
    });

    private static readonly object EsquemaRoteiro = Objeto(new
    {
        momentos = new
        {
            type = "array",
            items = Objeto(new
            {
                horario = new { type = "string" },
                titulo = new { type = "string" },
                descricao = new { type = "string" },
            }),
        },
        brincadeiras = new
        {
            type = "array",
            items = Objeto(new
            {
                titulo = new { type = "string" },
                descricao = new { type = "string" },
                materiais = new { type = "string" },
            }),
        },
    });

    /// <summary>Objeto do esquema JSON com todas as propriedades obrigatórias e nenhuma a mais.</summary>
    private static object Objeto(object propriedades) => new
    {
        type = "object",
        properties = propriedades,
        required = propriedades.GetType().GetProperties().Select(p => p.Name).ToArray(),
        additionalProperties = false,
    };

    /// <summary>A lista em que o assistente está trabalhando e quantas gerações ela já usou.</summary>
    private sealed record ListaAssistente(Evento Evento, int? FormandoId)
    {
        public int Usadas { get; set; }
    }

    // Formato da resposta da IA (igual aos esquemas acima)
    private sealed record RespostaPresentesIa(List<PresenteIa>? Presentes);
    private sealed record PresenteIa(string? Nome, string? Descricao, decimal? Valor, int? Cotas);
    private sealed record RespostaRoteiroIa(List<MomentoIa>? Momentos, List<BrincadeiraIa>? Brincadeiras);
    private sealed record MomentoIa(string? Horario, string? Titulo, string? Descricao);
    private sealed record BrincadeiraIa(string? Titulo, string? Descricao, string? Materiais);
}
