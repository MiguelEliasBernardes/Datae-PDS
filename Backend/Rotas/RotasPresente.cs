using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de presente: só recebem a requisição, chamam o ServicoPresente e traduzem o resultado para HTTP.
/// Ficam "dentro" do evento: /api/eventos/{eventoId}/presentes.
/// </summary>
public static class RotasPresente
{
    public static void MapearRotasPresente(this WebApplication app)
    {
        var presentes = app.MapGroup("/api/eventos/{eventoId:int}/presentes")
            .WithTags("Presentes")
            .RequireAuthorization();

        presentes.MapGet("/", Listar);
        presentes.MapPost("/", Criar);
        presentes.MapGet("/{id:int}", Obter);
        presentes.MapPut("/{id:int}", Atualizar);
        presentes.MapDelete("/{id:int}", Excluir);
    }

    // Filtro opcional: /presentes?status=Disponivel
    private static async Task<IResult> Listar(
        int eventoId, StatusPresente? status, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ListarAsync(usuarioId, eventoId, status);
        return ParaHttp(resultado, presentes => Results.Ok(presentes.Select(ParaResposta)));
    }

    private static async Task<IResult> Criar(
        int eventoId, CriarPresenteRequisicao requisicao, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.CriarAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, presente =>
            Results.Created($"/api/eventos/{eventoId}/presentes/{presente.Id}", ParaResposta(presente)));
    }

    private static async Task<IResult> Obter(
        int eventoId, int id, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ObterAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> Atualizar(
        int eventoId,
        int id,
        AtualizarPresenteRequisicao requisicao,
        ClaimsPrincipal principal,
        ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.AtualizarAsync(usuarioId, eventoId, id, requisicao);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> Excluir(
        int eventoId, int id, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ExcluirAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static PresenteResposta ParaResposta(ItemPresente presente) => new(
        presente.Id,
        presente.EventoId,
        presente.ConvidadoId,
        presente.Nome,
        presente.Descricao,
        presente.ValorEstimado,
        presente.Status,
        presente.LinkAfiliado,
        presente.Foto);
}
