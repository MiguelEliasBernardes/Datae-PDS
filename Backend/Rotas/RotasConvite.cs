using System.Security.Claims;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Convites para a comissão de formatura (link /convite/{codigo} no frontend).
/// Ver o convite não exige login; aceitar exige. As duas têm limite de requisições por IP,
/// para ninguém conseguir testar códigos em massa.
/// </summary>
public static class RotasConvite
{
    public static void MapearRotasConvite(this WebApplication app)
    {
        var convites = app.MapGroup("/api/convites/{codigo}").WithTags("Convites");

        convites.MapGet("/", Obter).RequireRateLimiting(RotasPublicas.PoliticaLimite);
        convites.MapPost("/aceitar", Aceitar).RequireAuthorization().RequireRateLimiting(RotasPublicas.PoliticaLimite);
    }

    private static async Task<IResult> Obter(string codigo, ServicoConvite servico)
    {
        var resultado = await servico.ObterAsync(codigo);
        return ParaHttp(resultado, Results.Ok);
    }

    // Devolve o evento em que a pessoa entrou, já com o papel e as permissões dela
    private static async Task<IResult> Aceitar(string codigo, ClaimsPrincipal principal, ServicoConvite servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AceitarAsync(usuarioId, codigo);
        return ParaHttp(resultado, acesso => Results.Ok(RotasEvento.ParaResposta(acesso)));
    }
}
