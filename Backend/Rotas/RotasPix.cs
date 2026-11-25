using System.Security.Claims;
using Backend.Dtos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Relatório dos Pix avisados pelos convidados (/api/eventos/{eventoId}/pix-informados), para quem tem a
/// permissão Financeiro. As alterações devolvem o relatório inteiro.
/// </summary>
public static class RotasPix
{
    public static void MapearRotasPix(this WebApplication app)
    {
        var pix = app.MapGroup("/api/eventos/{eventoId:int}/pix-informados")
            .WithTags("Pix")
            .RequireAuthorization();

        pix.MapGet("/", ObterRelatorio);
        pix.MapPut("/{id:int}", Atualizar);
        pix.MapDelete("/{id:int}", Excluir);
    }

    private static async Task<IResult> ObterRelatorio(int eventoId, ClaimsPrincipal principal, ServicoPixInformado servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.ObterRelatorioAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> Atualizar(
        int eventoId, int id, AtualizarPixInformadoRequisicao requisicao, ClaimsPrincipal principal, ServicoPixInformado servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.AtualizarAsync(usuarioId, eventoId, id, requisicao), Results.Ok);
    }

    private static async Task<IResult> Excluir(int eventoId, int id, ClaimsPrincipal principal, ServicoPixInformado servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        return ParaHttp(await servico.ExcluirAsync(usuarioId, eventoId, id), Results.Ok);
    }
}
