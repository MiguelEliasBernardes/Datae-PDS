using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Pós-evento: resumo da arrecadação, agradecimentos por e-mail e WhatsApp e a pré-visualização da recapitulação.
/// A recapitulação pública fica em RotasPublicas (/api/publico/eventos/{slug}/recapitulacao).
/// </summary>
public static class RotasPosEvento
{
    public static void MapearRotasPosEvento(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/eventos/{eventoId:int}/pos-evento").WithTags("Pós-evento").RequireAuthorization();

        grupo.MapGet("/", ObterResumo);
        grupo.MapPost("/resumo/email", EnviarResumo);
        grupo.MapPost("/agradecimentos/email", EnviarAgradecimentosEmail);
        grupo.MapPost("/agradecimentos/{convidadoId:int}/whatsapp", RegistrarWhatsApp);
        grupo.MapGet("/recapitulacao", ObterRecapitulacao);
    }

    private static async Task<IResult> ObterResumo(int eventoId, ClaimsPrincipal principal, ServicoPosEvento servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.ObterResumoAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> EnviarResumo(int eventoId, ClaimsPrincipal principal, ServicoPosEvento servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.EnviarResumoAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> EnviarAgradecimentosEmail(
        int eventoId, EnviarAgradecimentosRequisicao requisicao, ClaimsPrincipal principal, ServicoPosEvento servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.EnviarAgradecimentosEmailAsync(usuarioId, eventoId, requisicao), Results.Ok);
    }

    private static async Task<IResult> RegistrarWhatsApp(
        int eventoId, int convidadoId, ClaimsPrincipal principal, ServicoPosEvento servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.RegistrarWhatsAppAsync(usuarioId, eventoId, convidadoId), _ => Results.NoContent());
    }

    private static async Task<IResult> ObterRecapitulacao(int eventoId, ClaimsPrincipal principal, ServicoPosEvento servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ObterRecapitulacaoAsync(usuarioId, eventoId);
        return ParaHttp(resultado, r => Results.Ok(ParaResposta(r.Evento, r.Dados)));
    }

    /// <summary>Usado também pela rota pública da recapitulação.</summary>
    internal static RecapitulacaoResposta ParaResposta(Evento evento, ServicoPosEvento.RecapitulacaoDados dados) => new(
        RotasPublicas.ParaResposta(evento),
        dados.Mensagem,
        dados.PessoasPresentes,
        dados.PresentesRecebidos,
        dados.Presenteadores,
        dados.Fotos.Select(f => new FotoPublicaResposta(f.Id, f.NomeAutor, ServicoMural.UrlDaFoto(f), f.EnviadaEm)).ToList());
}
