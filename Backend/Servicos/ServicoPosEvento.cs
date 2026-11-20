using System.Globalization;
using System.Text;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Jornada pós-evento:
/// - resumo do que foi arrecadado (presentes inteiros e cotas) e da presença, para quem gerencia o evento;
/// - agradecimento aos convidados por WhatsApp (link wa.me com a mensagem pronta) e/ou e-mail;
/// - página pública de recapitulação (/e/{slug}/recapitulacao), aberta depois da data do evento.
/// O resumo também vai por e-mail ao dono, sozinho, um dia depois do evento (ResumoPosEventoAutomatico).
/// </summary>
public class ServicoPosEvento(
    ContextoBanco banco, ServicoEmail servicoEmail, IConfiguration configuracao, ILogger<ServicoPosEvento> logger)
{
    /// <summary>Endereço da recapitulação; nenhum formando pode ter este slug (ver ServicoFormando).</summary>
    public const string SlugRecapitulacao = "recapitulacao";

    private static readonly CultureInfo PtBr = new("pt-BR");

    public async Task<Resultado<ResumoPosEventoResposta>> ObterResumoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<ResumoPosEventoResposta>();

        return Resultado<ResumoPosEventoResposta>.Ok(await MontarResumoAsync(acesso.Valor!.Evento));
    }

    /// <summary>
    /// Envia o agradecimento por e-mail. Sem lista de convidados, manda para todos que têm e-mail
    /// e ainda não receberam (ou para todos, com Reenviar).
    /// </summary>
    public async Task<Resultado<EnvioAgradecimentosResposta>> EnviarAgradecimentosEmailAsync(
        int usuarioId, int eventoId, EnviarAgradecimentosRequisicao requisicao)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<EnvioAgradecimentosResposta>();
        if (!servicoEmail.Configurado)
            return EmailIndisponivel<EnvioAgradecimentosResposta>();

        var evento = acesso.Valor!.Evento;
        var resumo = await MontarResumoAsync(evento);
        var ids = requisicao.ConvidadoIds is { Count: > 0 } lista ? lista.ToHashSet() : null;
        var reenviar = requisicao.Reenviar == true || ids is not null;

        var destinatarios = resumo.Agradecimentos
            .Where(a => a.Email is not null)
            .Where(a => ids is null ? reenviar || a.EmailEnviadoEm is null : ids.Contains(a.ConvidadoId))
            .ToList();

        if (ids is not null && destinatarios.Count == 0)
            return Resultado<EnvioAgradecimentosResposta>.Invalido(new()
            {
                ["convidadoIds"] = ["Nenhum dos convidados escolhidos tem e-mail cadastrado."],
            });

        var enviados = new List<int>();
        var falhas = 0;
        var assunto = $"Obrigado por fazer parte de {evento.NomeEvento}!";
        foreach (var agradecimento in destinatarios)
        {
            try
            {
                await servicoEmail.EnviarAsync(agradecimento.Email!, agradecimento.Nome, assunto, agradecimento.Mensagem);
                enviados.Add(agradecimento.ConvidadoId);
            }
            catch (Exception erro)
            {
                falhas++;
                logger.LogWarning(erro, "Falha ao enviar o agradecimento do evento {EventoId} para o convidado {ConvidadoId}",
                    evento.Id, agradecimento.ConvidadoId);
            }
        }

        if (enviados.Count > 0)
        {
            var agora = DateTime.UtcNow;
            await banco.Convidados
                .Where(c => c.EventoId == evento.Id && enviados.Contains(c.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.AgradecimentoEmailEm, agora));
        }

        return Resultado<EnvioAgradecimentosResposta>.Ok(
            new EnvioAgradecimentosResposta(enviados.Count, falhas, await MontarResumoAsync(evento)));
    }

    /// <summary>
    /// O WhatsApp é aberto pelo navegador do organizador (link wa.me), então o sistema não sabe se a mensagem
    /// foi mesmo enviada: só registra que o link foi aberto, para marcar o convidado na lista.
    /// </summary>
    public async Task<Resultado<bool>> RegistrarWhatsAppAsync(int usuarioId, int eventoId, int convidadoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<bool>();

        var alterados = await banco.Convidados
            .Where(c => c.Id == convidadoId && c.EventoId == eventoId && c.Telefone != null)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.AgradecimentoWhatsAppEm, DateTime.UtcNow));

        return alterados == 0
            ? Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Convidado não encontrado ou sem telefone.")
            : Resultado<bool>.Ok(true);
    }

    /// <summary>Manda o resumo agora para o e-mail de quem pediu.</summary>
    public async Task<Resultado<EnvioResumoResposta>> EnviarResumoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<EnvioResumoResposta>();
        if (!servicoEmail.Configurado)
            return EmailIndisponivel<EnvioResumoResposta>();

        var usuario = await banco.Usuarios.AsNoTracking().FirstAsync(u => u.Id == usuarioId);
        var evento = acesso.Valor!.Evento;
        try
        {
            await EnviarResumoPorEmailAsync(evento, usuario);
        }
        catch (Exception erro)
        {
            logger.LogWarning(erro, "Falha ao enviar o resumo do evento {EventoId}", evento.Id);
            return Resultado<EnvioResumoResposta>.Falha(TipoErro.Indisponivel, "Não foi possível enviar o e-mail agora. Tente de novo mais tarde.");
        }

        return Resultado<EnvioResumoResposta>.Ok(new EnvioResumoResposta(usuario.Email));
    }

    /// <summary>Envio automático (chamado pelo ResumoPosEventoAutomatico) para o dono do evento.</summary>
    public async Task EnviarResumoAutomaticoAsync(Evento evento, CancellationToken cancelamento)
    {
        var dono = await banco.Usuarios.AsNoTracking().FirstAsync(u => u.Id == evento.UsuarioId, cancelamento);
        await EnviarResumoPorEmailAsync(evento, dono, cancelamento);
    }

    /// <summary>Recapitulação pública: só abre depois da data do evento.</summary>
    public async Task<Resultado<(Evento Evento, RecapitulacaoDados Dados)>> ObterRecapitulacaoPublicaAsync(string slug)
    {
        var slugNormalizado = (slug ?? string.Empty).Trim().ToLowerInvariant();
        var evento = await banco.Eventos.AsNoTracking().FirstOrDefaultAsync(e => e.SlugPublico == slugNormalizado);
        if (evento is null)
            return Resultado<(Evento, RecapitulacaoDados)>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado. Confira o link.");
        if (evento.DataEvento > DateTime.UtcNow)
            return Resultado<(Evento, RecapitulacaoDados)>.Falha(
                TipoErro.NaoEncontrado, "A recapitulação fica disponível depois do evento. Volte em breve!");

        return Resultado<(Evento, RecapitulacaoDados)>.Ok((evento, await MontarRecapitulacaoAsync(evento)));
    }

    /// <summary>Pré-visualização para quem participa do evento, a qualquer momento (antes da data também).</summary>
    public async Task<Resultado<(Evento Evento, RecapitulacaoDados Dados)>> ObterRecapitulacaoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento);
        if (!acesso.Sucesso)
            return acesso.Repassar<(Evento, RecapitulacaoDados)>();

        var evento = acesso.Valor!.Evento;
        return Resultado<(Evento, RecapitulacaoDados)>.Ok((evento, await MontarRecapitulacaoAsync(evento)));
    }

    /// <summary>Números gerais da recapitulação, sem valores nem nomes de quem deu presente.</summary>
    public record RecapitulacaoDados(string Mensagem, int PessoasPresentes, int PresentesRecebidos, int Presenteadores, List<FotoMural> Fotos);

    private async Task<RecapitulacaoDados> MontarRecapitulacaoAsync(Evento evento)
    {
        var confirmados = await banco.Convidados
            .Where(c => c.EventoId == evento.Id && c.StatusPresenca == StatusPresenca.Confirmado)
            .Select(c => 1 + c.QuantidadeAcompanhantes)
            .SumAsync();

        var (presentes, cotas) = await CarregarPresentesAsync(evento.Id);
        var recebidos = presentes.Count(p => p.QuantidadeCotas is null && p.Status != StatusPresente.Disponivel)
            + presentes.Count(p => p.QuantidadeCotas is not null && p.CotasVendidas > 0);

        var fotos = evento.MuralAtivo
            ? await banco.FotosMural
                .Where(f => f.EventoId == evento.Id && f.Status == StatusFoto.Aprovada)
                .OrderBy(f => f.EnviadaEm)
                .ToListAsync()
            : [];

        return new RecapitulacaoDados(
            evento.MensagemAgradecimento ?? MensagemPadrao(evento),
            confirmados,
            recebidos,
            ContarPresenteadores(presentes, cotas),
            fotos);
    }

    private async Task<(List<ItemPresente> Presentes, List<CotaPresente> Cotas)> CarregarPresentesAsync(int eventoId)
    {
        var presentes = await banco.ItensPresente.AsNoTracking()
            .Where(p => p.EventoId == eventoId)
            .OrderBy(p => p.Nome)
            .ToListAsync();
        var idsPresentes = presentes.Select(p => p.Id).ToList();
        var cotas = await banco.CotasPresente.AsNoTracking()
            .Where(c => idsPresentes.Contains(c.ItemPresenteId))
            .OrderBy(c => c.CriadoEm)
            .ToListAsync();
        return (presentes, cotas);
    }

    /// <summary>Pessoas diferentes que deram presente inteiro ou cotas.</summary>
    private static int ContarPresenteadores(List<ItemPresente> presentes, List<CotaPresente> cotas) =>
        presentes
            .Where(p => p.QuantidadeCotas is null && p.Status != StatusPresente.Disponivel && p.ConvidadoId is not null)
            .Select(p => $"c{p.ConvidadoId}")
            .Concat(cotas.Select(c => c.ConvidadoId is int id ? $"c{id}" : $"n{c.NomeConvidado.ToLowerInvariant()}"))
            .Distinct()
            .Count();

    private async Task<ResumoPosEventoResposta> MontarResumoAsync(Evento evento)
    {
        var (presentes, cotas) = await CarregarPresentesAsync(evento.Id);
        var convidados = await banco.Convidados.AsNoTracking()
            .Where(c => c.EventoId == evento.Id)
            .OrderBy(c => c.Nome)
            .ToListAsync();
        var nomesFormandos = await banco.Formandos
            .Where(f => f.EventoId == evento.Id)
            .ToDictionaryAsync(f => f.Id, f => f.Nome);
        var nomesConvidados = convidados.ToDictionary(c => c.Id, c => c.Nome);
        string? NomeFormando(ItemPresente p) => p.FormandoId is int id ? nomesFormandos.GetValueOrDefault(id) : null;

        var inteiros = presentes
            .Where(p => p.QuantidadeCotas is null && p.Status != StatusPresente.Disponivel)
            .Select(p => new PresenteRecebidoResposta(
                p.Id, p.Nome, p.ValorEstimado, p.Status,
                p.ConvidadoId is int id ? nomesConvidados.GetValueOrDefault(id) : null,
                NomeFormando(p)))
            .ToList();

        var cotasPorPresente = cotas.ToLookup(c => c.ItemPresenteId);
        var comCotas = presentes
            .Where(p => p.QuantidadeCotas is not null && p.CotasVendidas > 0)
            .Select(p => new PresenteCotasResumoResposta(
                p.Id, p.Nome, p.ValorEstimado, p.QuantidadeCotas!.Value, p.CotasVendidas,
                cotasPorPresente[p.Id].Sum(c => c.Valor),
                NomeFormando(p),
                cotasPorPresente[p.Id].Select(c => new CompraCotaResumoResposta(c.NomeConvidado, c.Quantidade, c.Valor, c.CriadoEm)).ToList()))
            .ToList();

        var valorPresentes = inteiros.Sum(p => p.Valor ?? 0);
        var valorCotas = comCotas.Sum(p => p.ValorArrecadado);

        return new ResumoPosEventoResposta(
            evento.NomeEvento,
            evento.DataEvento,
            evento.DataEvento <= DateTime.UtcNow,
            valorPresentes + valorCotas,
            valorPresentes,
            valorCotas,
            inteiros.Count(p => p.Status == StatusPresente.Comprado),
            inteiros.Count(p => p.Status == StatusPresente.Reservado),
            comCotas.Sum(p => p.CotasVendidas),
            ContarPresenteadores(presentes, cotas),
            convidados.Count(c => c.StatusPresenca == StatusPresenca.Confirmado),
            convidados.Where(c => c.StatusPresenca == StatusPresenca.Confirmado).Sum(c => c.QuantidadeAcompanhantes),
            convidados.Count(c => c.StatusPresenca == StatusPresenca.Recusado),
            convidados.Count(c => c.StatusPresenca == StatusPresenca.Pendente),
            await banco.FotosMural.CountAsync(f => f.EventoId == evento.Id && f.Status == StatusFoto.Aprovada),
            inteiros,
            comCotas,
            MontarAgradecimentos(evento, convidados, presentes, cotas),
            evento.MensagemAgradecimento,
            MensagemPadrao(evento),
            LinkRecapitulacao(evento),
            servicoEmail.Configurado,
            evento.ResumoEnviadoEm);
    }

    /// <summary>
    /// Quem recebe agradecimento: quem confirmou presença ou deu algum presente.
    /// A mensagem cita os presentes de cada um.
    /// </summary>
    private List<AgradecimentoResposta> MontarAgradecimentos(
        Evento evento, List<Convidado> convidados, List<ItemPresente> presentes, List<CotaPresente> cotas)
    {
        var presentesPorConvidado = presentes
            .Where(p => p.QuantidadeCotas is null && p.Status != StatusPresente.Disponivel && p.ConvidadoId is not null)
            .ToLookup(p => p.ConvidadoId!.Value, p => p.Nome);
        var nomesPresentes = presentes.ToDictionary(p => p.Id, p => p.Nome);
        var cotasPorConvidado = cotas
            .Where(c => c.ConvidadoId is not null)
            .ToLookup(c => c.ConvidadoId!.Value);

        var resultado = new List<AgradecimentoResposta>();
        foreach (var convidado in convidados)
        {
            var presentesDele = presentesPorConvidado[convidado.Id].ToList();
            var cotasDele = cotasPorConvidado[convidado.Id]
                .GroupBy(c => c.ItemPresenteId)
                .Select(g => (Nome: nomesPresentes.GetValueOrDefault(g.Key, "presente"), Quantidade: g.Sum(c => c.Quantidade)))
                .ToList();

            var confirmou = convidado.StatusPresenca == StatusPresenca.Confirmado;
            if (!confirmou && presentesDele.Count == 0 && cotasDele.Count == 0)
                continue;

            var motivos = new List<string>();
            if (confirmou)
                motivos.Add(convidado.QuantidadeAcompanhantes > 0
                    ? $"Confirmou presença (+{convidado.QuantidadeAcompanhantes})"
                    : "Confirmou presença");
            motivos.AddRange(presentesDele.Select(nome => $"Presente: {nome}"));
            motivos.AddRange(cotasDele.Select(c => $"{(c.Quantidade == 1 ? "1 cota" : $"{c.Quantidade} cotas")} de {c.Nome}"));

            var carinho = presentesDele.Concat(cotasDele.Select(c => c.Nome)).Distinct().ToList();
            var mensagem = MontarMensagem(evento, convidado.Nome, carinho);

            resultado.Add(new AgradecimentoResposta(
                convidado.Id,
                convidado.Nome,
                convidado.Telefone,
                convidado.Email,
                motivos,
                mensagem,
                convidado.Telefone is string telefone ? $"https://wa.me/{telefone}?text={Uri.EscapeDataString(mensagem)}" : null,
                convidado.AgradecimentoEmailEm,
                convidado.AgradecimentoWhatsAppEm));
        }

        return resultado;
    }

    private string MontarMensagem(Evento evento, string nome, List<string> presentes)
    {
        var primeiroNome = nome.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? nome;
        var texto = new StringBuilder();
        texto.AppendLine($"Olá, {primeiroNome}!");
        texto.AppendLine();
        texto.AppendLine(evento.MensagemAgradecimento ?? MensagemPadrao(evento));
        if (presentes.Count > 0)
        {
            texto.AppendLine();
            texto.AppendLine($"Obrigado também pelo carinho com {JuntarLista(presentes)}.");
        }
        texto.AppendLine();
        texto.Append($"Veja como foi: {LinkRecapitulacao(evento)}");
        return texto.ToString();
    }

    private static string MensagemPadrao(Evento evento) =>
        $"Muito obrigado por fazer parte de {evento.NomeEvento}! Foi muito especial ter você com a gente.";

    /// <summary>Endereço absoluto do site (para os links do e-mail e do WhatsApp).</summary>
    private string UrlSite =>
        (Validacoes.TextoOpcional(configuracao["UrlSite"])
            ?? configuracao.GetSection("OrigensPermitidas").Get<string[]>()?.FirstOrDefault()
            ?? "http://localhost:5173").TrimEnd('/');

    private string LinkRecapitulacao(Evento evento) => $"{UrlSite}/e/{evento.SlugPublico}/{SlugRecapitulacao}";

    private async Task EnviarResumoPorEmailAsync(Evento evento, Usuario destinatario, CancellationToken cancelamento = default)
    {
        var resumo = await MontarResumoAsync(evento);
        await servicoEmail.EnviarAsync(
            destinatario.Email, destinatario.Nome, $"Resumo do pós-evento: {evento.NomeEvento}", TextoResumo(resumo), cancelamento);
    }

    /// <summary>Resumo em texto para o e-mail do organizador.</summary>
    private string TextoResumo(ResumoPosEventoResposta resumo)
    {
        string Moeda(decimal valor) => $"R$ {valor.ToString("N2", PtBr)}";
        var texto = new StringBuilder();
        texto.AppendLine($"Resumo do pós-evento: {resumo.NomeEvento}");
        texto.AppendLine();
        texto.AppendLine($"Total arrecadado (estimado): {Moeda(resumo.TotalArrecadado)}");
        texto.AppendLine($"- Presentes: {resumo.PresentesComprados} comprados e {resumo.PresentesReservados} reservados ({Moeda(resumo.ValorPresentes)})");
        texto.AppendLine($"- Cotas: {resumo.CotasVendidas} vendidas ({Moeda(resumo.ValorCotas)})");
        texto.AppendLine($"- {resumo.Presenteadores} pessoas deram presente");
        texto.AppendLine();
        texto.AppendLine($"Presença: {resumo.Confirmados} confirmados (+{resumo.Acompanhantes} acompanhantes), "
            + $"{resumo.Recusados} não puderam ir e {resumo.Pendentes} não responderam.");
        texto.AppendLine($"Fotos aprovadas no mural: {resumo.FotosAprovadas}");

        if (resumo.Presentes.Count > 0)
        {
            texto.AppendLine();
            texto.AppendLine("Presentes recebidos:");
            foreach (var p in resumo.Presentes)
            {
                var valor = p.Valor is decimal v ? $" ({Moeda(v)})" : string.Empty;
                var de = p.NomeConvidado is null ? string.Empty : $", de {p.NomeConvidado}";
                var lista = p.NomeFormando is null ? string.Empty : $" [lista de {p.NomeFormando}]";
                var status = p.Status == StatusPresente.Comprado ? "comprado" : "reservado";
                texto.AppendLine($"- {p.Nome}{valor}{de}, {status}{lista}");
            }
        }

        if (resumo.PresentesComCotas.Count > 0)
        {
            texto.AppendLine();
            texto.AppendLine("Presentes em cotas:");
            foreach (var p in resumo.PresentesComCotas)
            {
                var lista = p.NomeFormando is null ? string.Empty : $" [lista de {p.NomeFormando}]";
                texto.AppendLine($"- {p.Nome}: {p.CotasVendidas} de {p.QuantidadeCotas} cotas ({Moeda(p.ValorArrecadado)}){lista}");
                foreach (var compra in p.Compras)
                    texto.AppendLine($"    {compra.NomeConvidado}: {compra.Quantidade} {(compra.Quantidade == 1 ? "cota" : "cotas")} ({Moeda(compra.Valor)})");
            }
        }

        var semContato = resumo.Agradecimentos.Count(a => a.Telefone is null && a.Email is null);
        texto.AppendLine();
        texto.AppendLine($"Agradecimentos: {resumo.Agradecimentos.Count} convidados para agradecer"
            + (semContato > 0 ? $" ({semContato} sem telefone nem e-mail)." : "."));
        texto.AppendLine($"Envie pelo painel do evento, em Pós-evento: {UrlSite}");
        texto.AppendLine();
        texto.AppendLine("Os valores são estimados a partir da lista de presentes. Com o Pix, confira os depósitos no extrato do banco.");
        return texto.ToString();
    }

    private static string JuntarLista(List<string> itens) => itens.Count switch
    {
        1 => itens[0],
        _ => $"{string.Join(", ", itens.Take(itens.Count - 1))} e {itens[^1]}",
    };

    private static Resultado<T> EmailIndisponivel<T>() =>
        Resultado<T>.Falha(TipoErro.Indisponivel, "O envio de e-mail não está configurado no servidor.");
}
