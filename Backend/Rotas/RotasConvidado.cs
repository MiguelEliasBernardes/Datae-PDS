using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de convidado: só recebem a requisição, chamam o ServicoConvidado e traduzem o resultado para HTTP.
/// Ficam "dentro" do evento: /api/eventos/{eventoId}/convidados.
/// </summary>
public static class RotasConvidado
{
    public static void MapearRotasConvidado(this WebApplication app)
    {
        var convidados = app.MapGroup("/api/eventos/{eventoId:int}/convidados")
            .WithTags("Convidados")
            .RequireAuthorization();

        convidados.MapGet("/", Listar);
        convidados.MapPost("/", Criar);
        convidados.MapGet("/{id:int}", Obter);
        convidados.MapPut("/{id:int}", Atualizar);
        convidados.MapDelete("/{id:int}", Excluir);
    }

    // Filtro opcional: /convidados?status=Confirmado
    private static async Task<IResult> Listar(
        int eventoId, StatusPresenca? status, ClaimsPrincipal principal, ServicoConvidado servicoConvidado)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoConvidado.ListarAsync(usuarioId, eventoId, status);
        return ParaHttp(resultado, convidados => Results.Ok(convidados.Select(ParaResposta)));
    }

    private static async Task<IResult> Criar(
        int eventoId, CriarConvidadoRequisicao requisicao, ClaimsPrincipal principal, ServicoConvidado servicoConvidado)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoConvidado.CriarAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, convidado =>
            Results.Created($"/api/eventos/{eventoId}/convidados/{convidado.Id}", ParaResposta(convidado)));
    }

    private static async Task<IResult> Obter(
        int eventoId, int id, ClaimsPrincipal principal, ServicoConvidado servicoConvidado)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoConvidado.ObterAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, convidado => Results.Ok(ParaResposta(convidado)));
    }

    private static async Task<IResult> Atualizar(
        int eventoId,
        int id,
        AtualizarConvidadoRequisicao requisicao,
        ClaimsPrincipal principal,
        ServicoConvidado servicoConvidado)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoConvidado.AtualizarAsync(usuarioId, eventoId, id, requisicao);
        return ParaHttp(resultado, convidado => Results.Ok(ParaResposta(convidado)));
    }

    private static async Task<IResult> Excluir(
        int eventoId, int id, ClaimsPrincipal principal, ServicoConvidado servicoConvidado)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoConvidado.ExcluirAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static ConvidadoResposta ParaResposta(Convidado convidado) => new(
        convidado.Id,
        convidado.EventoId,
        convidado.Nome,
        convidado.Email,
        convidado.StatusPresenca,
        convidado.QuantidadeAcompanhantes,
        convidado.Observacao);
}
