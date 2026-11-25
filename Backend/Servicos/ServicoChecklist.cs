using System.Globalization;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>Checklist montada para quem está vendo: os itens, os nomes dos responsáveis e as dicas.</summary>
public record Checklist(
    AcessoEvento Acesso,
    List<ItemChecklist> Itens,
    Dictionary<int, string> NomesFormandos,
    List<DicaChecklistResposta> Dicas);

/// <summary>
/// Checklist do evento, em duas camadas:
/// - itens: a checklist começa vazia; o organizador cria os itens à mão (ou pelo Roteiro com IA, que cria
///   os momentos do dia e as brincadeiras), depois marca, edita e apaga;
/// - dicas: calculadas na hora a partir do estado do evento (lista vazia, Pix sem configurar,
///   convidados sem confirmar...). Não ficam gravadas e somem quando a situação se resolve.
/// Quem gerencia o evento altera tudo; um formando responsável por um item pode marcá-lo como feito.
/// Toda alteração devolve a checklist inteira, para a tela atualizar o progresso e as dicas.
/// </summary>
public class ServicoChecklist(ContextoBanco banco, ServicoRateio servicoRateio)
{
    private const int MaximoDiasAntes = 730;
    private const int DiasParaCobrarConfirmacoes = 14;
    private static readonly CultureInfo PtBr = new("pt-BR");

    public async Task<Resultado<Checklist>> ObterAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<Checklist>();

        return Resultado<Checklist>.Ok(await MontarAsync(usuarioId, acesso.Valor!));
    }

    public async Task<Resultado<Checklist>> CriarItemAsync(int usuarioId, int eventoId, CriarItemChecklistRequisicao requisicao)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Checklist>();

        var titulo = (requisicao.Titulo ?? string.Empty).Trim();
        var descricao = TextoOpcional(requisicao.Descricao);
        var erros = new Dictionary<string, string[]>();

        ValidarTexto(titulo, descricao, erros);
        if (requisicao.Categoria is CategoriaChecklist categoria && !Enum.IsDefined(categoria))
            erros["categoria"] = ["Categoria inválida."];
        if (requisicao.DiasAntes is int dias && dias is < 0 or > MaximoDiasAntes)
            erros["diasAntes"] = [$"Informe de 0 a {MaximoDiasAntes} dias antes do evento."];
        await ValidarResponsavelAsync(acesso.Valor!.Evento, requisicao.ResponsavelFormandoId, erros);

        if (erros.Count > 0)
            return Resultado<Checklist>.Invalido(erros);

        banco.ItensChecklist.Add(new ItemChecklist
        {
            EventoId = eventoId,
            Titulo = titulo,
            Descricao = descricao,
            Categoria = requisicao.Categoria ?? CategoriaChecklist.Preparativos,
            DiasAntes = requisicao.DiasAntes,
            Origem = OrigemItemChecklist.Manual,
            ResponsavelFormandoId = requisicao.ResponsavelFormandoId,
            Ordem = await ProximaOrdemAsync(eventoId),
        });
        await banco.SaveChangesAsync();

        return Resultado<Checklist>.Ok(await MontarAsync(usuarioId, acesso.Valor));
    }

    public async Task<Resultado<Checklist>> AtualizarItemAsync(
        int usuarioId, int eventoId, int id, AtualizarItemChecklistRequisicao requisicao)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<Checklist>();

        var item = await BuscarAsync(eventoId, id);
        if (item is null)
            return ItemNaoEncontrado();

        // Sem gerenciar o evento, o responsável pelo item só pode marcar ou desmarcar como feito
        if (!acesso.Valor!.Pode(Permissao.GerenciarEvento))
        {
            var soConclusao = requisicao is { Titulo: null, Descricao: null, Categoria: null, DiasAntes: null, ResponsavelFormandoId: null };
            if (!soConclusao || !EhResponsavel(acesso.Valor, item))
                return Resultado<Checklist>.Falha(
                    TipoErro.SemPermissao, "Você só pode marcar como feitos os itens pelos quais é responsável.");
        }

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Titulo is not null || requisicao.Descricao is not null)
        {
            var titulo = requisicao.Titulo?.Trim() ?? item.Titulo;
            var descricao = requisicao.Descricao is null ? item.Descricao : TextoOpcional(requisicao.Descricao);
            ValidarTexto(titulo, descricao, erros);
            item.Titulo = titulo;
            item.Descricao = descricao;
        }

        if (requisicao.Categoria is CategoriaChecklist categoria)
        {
            if (!Enum.IsDefined(categoria))
                erros["categoria"] = ["Categoria inválida."];
            else
                item.Categoria = categoria;
        }

        if (requisicao.DiasAntes is int dias)
        {
            if (dias == -1)
                item.DiasAntes = null;
            else if (dias is < 0 or > MaximoDiasAntes)
                erros["diasAntes"] = [$"Informe de 0 a {MaximoDiasAntes} dias antes do evento."];
            else
                item.DiasAntes = dias;
        }

        if (requisicao.ResponsavelFormandoId is int responsavel)
        {
            var novoResponsavel = responsavel == 0 ? (int?)null : responsavel;
            await ValidarResponsavelAsync(acesso.Valor.Evento, novoResponsavel, erros);
            item.ResponsavelFormandoId = novoResponsavel;
        }

        if (requisicao.Concluido is bool concluido && concluido != item.Concluido)
        {
            item.Concluido = concluido;
            item.ConcluidoEm = concluido ? DateTime.UtcNow : null;
        }

        if (erros.Count > 0)
            return Resultado<Checklist>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Checklist>.Ok(await MontarAsync(usuarioId, acesso.Valor));
    }

    public async Task<Resultado<Checklist>> ExcluirItemAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Checklist>();

        var item = await BuscarAsync(eventoId, id);
        if (item is null)
            return ItemNaoEncontrado();

        // Uma sugestão apagada pode voltar depois pela lista de sugestões (ela é achada pela chave)
        banco.ItensChecklist.Remove(item);
        await banco.SaveChangesAsync();
        return Resultado<Checklist>.Ok(await MontarAsync(usuarioId, acesso.Valor!));
    }

    /// <summary>
    /// Transforma um item da categoria Itens (ex.: "Jogo de panelas") num presente da lista do evento
    /// (sem valor: o organizador completa depois) e marca o item como feito.
    /// </summary>
    public async Task<Resultado<Checklist>> AdicionarComoPresenteAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Checklist>();

        var evento = acesso.Valor!.Evento;
        var item = await BuscarAsync(eventoId, id);
        if (item is null)
            return ItemNaoEncontrado();
        if (item.Categoria != CategoriaChecklist.Itens)
            return Resultado<Checklist>.Falha(TipoErro.Conflito, "Só itens da categoria \"Itens\" viram presentes.");
        if (evento.Tipo == TipoEvento.Formatura)
            return Resultado<Checklist>.Falha(
                TipoErro.Conflito, "Na formatura, os presentes ficam na lista de cada formando.");

        var nomeMinusculo = item.Titulo.ToLower();
        if (await banco.ItensPresente.AnyAsync(p =>
                p.EventoId == eventoId && p.FormandoId == null && p.Nome.ToLower() == nomeMinusculo))
            return Resultado<Checklist>.Falha(TipoErro.Conflito, "Já existe um presente com este nome na lista.");

        banco.ItensPresente.Add(new ItemPresente
        {
            EventoId = eventoId,
            Nome = item.Titulo,
            Descricao = item.Descricao,
        });
        item.Concluido = true;
        item.ConcluidoEm = DateTime.UtcNow;
        await banco.SaveChangesAsync();

        return Resultado<Checklist>.Ok(await MontarAsync(usuarioId, acesso.Valor));
    }

    private async Task<Checklist> MontarAsync(int usuarioId, AcessoEvento acesso)
    {
        var eventoId = acesso.Evento.Id;
        var itens = await banco.ItensChecklist.Where(i => i.EventoId == eventoId).ToListAsync();

        // Por categoria; dentro dela, o que vence antes primeiro e os itens sem prazo no fim
        itens = itens
            .OrderBy(i => i.Categoria)
            .ThenBy(i => i.DiasAntes is null)
            .ThenByDescending(i => i.DiasAntes)
            .ThenBy(i => i.Ordem)
            .ThenBy(i => i.Id)
            .ToList();

        var nomes = await banco.Formandos
            .Where(f => f.EventoId == eventoId)
            .ToDictionaryAsync(f => f.Id, f => f.Nome);

        return new Checklist(acesso, itens, nomes, await CalcularDicasAsync(usuarioId, acesso));
    }

    /// <summary>Dicas a partir do estado do evento, filtradas pelo que o usuário pode resolver.</summary>
    private async Task<List<DicaChecklistResposta>> CalcularDicasAsync(int usuarioId, AcessoEvento acesso)
    {
        var evento = acesso.Evento;
        var formatura = evento.Tipo == TipoEvento.Formatura;
        var dicas = new List<DicaChecklistResposta>();

        if (acesso.Pode(Permissao.GerenciarEvento))
        {
            dicas.Add(new("banner", "Personalize a página com uma foto de capa", null,
                evento.Banner is not null, AcaoDica.Configuracoes));
            dicas.Add(new("pix", "Configure o Pix para receber presentes em dinheiro", null,
                evento.ChavePix is not null, AcaoDica.Configuracoes));

            // Depois do evento: agradecer quem foi e quem deu presente
            if (evento.DataEvento <= DateTime.UtcNow)
            {
                var faltaAgradecer = await banco.Convidados.AnyAsync(c => c.EventoId == evento.Id
                    && (c.Telefone != null || c.Email != null)
                    && c.AgradecimentoEmailEm == null && c.AgradecimentoWhatsAppEm == null
                    && (c.StatusPresenca == StatusPresenca.Confirmado
                        || banco.ItensPresente.Any(p => p.ConvidadoId == c.Id)
                        || banco.CotasPresente.Any(k => k.ConvidadoId == c.Id)));
                dicas.Add(new("agradecimentos", "Agradeça os convidados",
                    "Mande a mensagem por WhatsApp ou e-mail com o link da recapitulação.", !faltaAgradecer, AcaoDica.PosEvento));
            }

            if (!formatura && evento.ListaPresentesAtiva)
            {
                var temPresentes = await banco.ItensPresente.AnyAsync(p => p.EventoId == evento.Id && p.FormandoId == null);
                dicas.Add(new("presentes", "Cadastre a lista de presentes",
                    "Os itens da categoria \"Itens\" da checklist viram presentes com um clique.", temPresentes, AcaoDica.Presentes));
            }

            var convidados = await banco.Convidados
                .Where(c => c.EventoId == evento.Id)
                .GroupBy(c => c.StatusPresenca == StatusPresenca.Pendente)
                .Select(g => new { Pendente = g.Key, Quantidade = g.Count() })
                .ToListAsync();
            dicas.Add(new("convidados", "Envie o link da página aos convidados",
                "Eles confirmam presença pela própria página.", convidados.Count > 0, AcaoDica.Convidados));

            var pendentes = convidados.FirstOrDefault(c => c.Pendente)?.Quantidade ?? 0;
            var diasParaOEvento = (evento.DataEvento - DateTime.UtcNow).TotalDays;
            if (pendentes > 0 && diasParaOEvento is >= 0 and <= DiasParaCobrarConfirmacoes)
                dicas.Add(new("confirmacoes", Plural(pendentes, "convidado ainda não confirmou", "convidados ainda não confirmaram") + " presença",
                    "Faltam poucos dias: vale mandar uma mensagem lembrando.", false, AcaoDica.Convidados));
        }

        if (acesso.Pode(Permissao.ModerarMural) && evento.MuralAtivo)
        {
            var fotosPendentes = await banco.FotosMural.CountAsync(f => f.EventoId == evento.Id && f.Status == StatusFoto.Pendente);
            if (fotosPendentes > 0)
                dicas.Add(new("mural", Plural(fotosPendentes, "foto esperando", "fotos esperando") + " aprovação no mural",
                    null, false, AcaoDica.Mural));
        }

        if (!formatura)
            return dicas;

        if (acesso.Pode(Permissao.GerenciarComissao))
        {
            var formandos = await banco.Formandos
                .Where(f => f.EventoId == evento.Id)
                .Select(f => f.UsuarioId != null)
                .ToListAsync();
            dicas.Add(new("formandos", "Cadastre os formandos da turma", null, formandos.Count > 0, AcaoDica.Formandos));

            var semEntrar = formandos.Count(vinculado => !vinculado);
            if (semEntrar > 0)
                dicas.Add(new("convites", Plural(semEntrar, "formando ainda não aceitou", "formandos ainda não aceitaram") + " o convite",
                    "Reenvie o link ou o código do convite.", false, AcaoDica.Formandos));
        }

        var temDespesas = await banco.Despesas.AnyAsync(d => d.EventoId == evento.Id);
        if (acesso.Pode(Permissao.Financeiro))
            dicas.Add(new("despesas", "Lance as despesas da formatura",
                "O rateio de cada formando é calculado a partir delas.", temDespesas, AcaoDica.Despesas));

        // O rateio já vem filtrado: o financeiro vê todos; os demais, só a própria linha
        if (temDespesas && (await servicoRateio.ObterAsync(usuarioId, evento.Id)).Valor is { } rateio)
        {
            if (acesso.Pode(Permissao.Financeiro))
            {
                var emAberto = rateio.Formandos.Count(f => !f.Quitado);
                if (emAberto > 0)
                    dicas.Add(new("rateio", Plural(emAberto, "formando com pagamento pendente", "formandos com pagamento pendente"),
                        null, false, AcaoDica.Rateio));
            }
            else if (rateio.Formandos.FirstOrDefault() is { } minhaParte)
            {
                var falta = minhaParte.ValorDevido - minhaParte.ValorPago;
                dicas.Add(new("minha-parte", minhaParte.Quitado ? "Sua parte no rateio está paga" : $"Faltam R$ {falta.ToString("N2", PtBr)} da sua parte no rateio",
                    null, minhaParte.Quitado, AcaoDica.Rateio));
            }
        }

        if (acesso.Formando is { } eu)
        {
            var temLista = await banco.ItensPresente.AnyAsync(p => p.EventoId == evento.Id && p.FormandoId == eu.Id);
            dicas.Add(new("minha-lista", "Monte a sua lista de presentes",
                "Ela aparece na sua página, dentro da página da formatura.", temLista, AcaoDica.MeusPresentes));
        }

        return dicas;
    }

    private async Task ValidarResponsavelAsync(Evento evento, int? formandoId, Dictionary<string, string[]> erros)
    {
        if (formandoId is not int id)
            return;

        if (evento.Tipo != TipoEvento.Formatura)
            erros["responsavelFormandoId"] = ["Só a formatura tem responsáveis por item (os integrantes da comissão)."];
        else if (!await banco.Formandos.AnyAsync(f => f.Id == id && f.EventoId == evento.Id))
            erros["responsavelFormandoId"] = ["Formando não encontrado nesta formatura."];
    }

    private static void ValidarTexto(string titulo, string? descricao, Dictionary<string, string[]> erros)
    {
        if (titulo.Length == 0)
            erros["titulo"] = ["Informe o que precisa ser feito."];
        else if (titulo.Length > 150)
            erros["titulo"] = ["O título pode ter no máximo 150 caracteres."];
        if (descricao?.Length > 500)
            erros["descricao"] = ["A descrição pode ter no máximo 500 caracteres."];
    }

    public static bool EhResponsavel(AcessoEvento acesso, ItemChecklist item) =>
        item.ResponsavelFormandoId is not null && item.ResponsavelFormandoId == acesso.Formando?.Id;

    private static string Plural(int quantidade, string singular, string plural) =>
        quantidade == 1 ? $"1 {singular}" : $"{quantidade} {plural}";

    private async Task<int> ProximaOrdemAsync(int eventoId) =>
        (await banco.ItensChecklist.Where(i => i.EventoId == eventoId).MaxAsync(i => (int?)i.Ordem) ?? -1) + 1;

    private Task<Resultado<AcessoEvento>> ExigirGestaoAsync(int usuarioId, int eventoId) =>
        ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarEvento);

    // O acesso ao evento já foi conferido pelo ControleAcesso
    private Task<ItemChecklist?> BuscarAsync(int eventoId, int id) =>
        banco.ItensChecklist.FirstOrDefaultAsync(i => i.Id == id && i.EventoId == eventoId);

    private static Resultado<Checklist> ItemNaoEncontrado() =>
        Resultado<Checklist>.Falha(TipoErro.NaoEncontrado, "Item da checklist não encontrado.");
}
