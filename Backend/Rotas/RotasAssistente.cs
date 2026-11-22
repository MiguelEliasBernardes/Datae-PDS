using System.Security.Claims;
using Backend.Dtos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas do assistente de IA (/api/eventos/{eventoId}/assistente). Só devolvem sugestões; o que o
/// organizador escolher é salvo pelas rotas de presentes e da checklist.
/// </summary>
public static class RotasAssistente
{
    public static void MapearRotasAssistente(this WebApplication app)
    {
        var assistente = app.MapGroup("/api/eventos/{eventoId:int}/assistente")
            .WithTags("Assistente")
            .RequireAuthorization();

        assistente.MapGet("/", ObterStatus);
        assistente.MapPost("/presentes", SugerirPresentes);
        assistente.MapPost("/roteiro", SugerirRoteiro);
    }

    private static async Task<IResult> ObterStatus(
        int eventoId, bool? minhaLista, ClaimsPrincipal principal, ServicoAssistente servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ObterStatusAsync(usuarioId, eventoId, minhaLista ?? false);
        return ParaHttp(resultado, Results.Ok);
    }

    private static async Task<IResult> SugerirPresentes(
        int eventoId, SugerirPresentesRequisicao requisicao, ClaimsPrincipal principal, ServicoAssistente servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.SugerirPresentesAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, Results.Ok);
    }

    private static async Task<IResult> SugerirRoteiro(
        int eventoId, SugerirRoteiroRequisicao requisicao, ClaimsPrincipal principal, ServicoAssistente servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.SugerirRoteiroAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, Results.Ok);
    }
}
