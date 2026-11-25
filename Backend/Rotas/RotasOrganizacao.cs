using System.Security.Claims;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Organização de um evento que não é formatura (/api/eventos/{eventoId}/organizacao): o código de convite
/// e os co-organizadores. Quem participa vê; só o dono troca o código e remove pessoas.
/// </summary>
public static class RotasOrganizacao
{
    public static void MapearRotasOrganizacao(this WebApplication app)
    {
        var organizacao = app.MapGroup("/api/eventos/{eventoId:int}/organizacao")
            .WithTags("Organização")
            .RequireAuthorization();

        organizacao.MapGet("/", Obter);
        organizacao.MapPost("/codigo", GerarCodigo);
        organizacao.MapDelete("/codigo", DesativarCodigo);
        organizacao.MapDelete("/membros/{id:int}", Remover);
        // O próprio co-organizador sai da organização
        organizacao.MapDelete("/eu", Sair);
    }

    private static async Task<IResult> Obter(int eventoId, ClaimsPrincipal principal, ServicoOrganizacao servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();
        return ParaHttp(await servico.ObterAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> GerarCodigo(int eventoId, ClaimsPrincipal principal, ServicoOrganizacao servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();
        return ParaHttp(await servico.GerarCodigoAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> DesativarCodigo(int eventoId, ClaimsPrincipal principal, ServicoOrganizacao servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();
        return ParaHttp(await servico.DesativarCodigoAsync(usuarioId, eventoId), Results.Ok);
    }

    private static async Task<IResult> Remover(int eventoId, int id, ClaimsPrincipal principal, ServicoOrganizacao servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();
        return ParaHttp(await servico.RemoverAsync(usuarioId, eventoId, id), Results.Ok);
    }

    private static async Task<IResult> Sair(int eventoId, ClaimsPrincipal principal, ServicoOrganizacao servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();
        return ParaHttp(await servico.SairAsync(usuarioId, eventoId), _ => Results.NoContent());
    }
}
