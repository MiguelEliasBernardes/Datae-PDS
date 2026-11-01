using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de evento: só recebem a requisição, chamam o ServicoEvento e traduzem o resultado para HTTP.
/// Todas exigem login e só enxergam os eventos do usuário logado.
/// </summary>
public static class RotasEvento
{
    public static void MapearRotasEvento(this WebApplication app)
    {
        var eventos = app.MapGroup("/api/eventos").WithTags("Eventos").RequireAuthorization();
        eventos.MapGet("/", Listar);
        eventos.MapPost("/", Criar);
        eventos.MapGet("/{id:int}", Obter);
        eventos.MapPut("/{id:int}", Atualizar);
        eventos.MapDelete("/{id:int}", Excluir);
    }

    private static async Task<IResult> Listar(ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ListarAsync(usuarioId);
        return ParaHttp(resultado, eventos => Results.Ok(eventos.Select(ParaResposta)));
    }

    private static async Task<IResult> Criar(
        CriarEventoRequisicao requisicao, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.CriarAsync(usuarioId, requisicao);
        return ParaHttp(resultado, evento => Results.Created($"/api/eventos/{evento.Id}", ParaResposta(evento)));
    }

    private static async Task<IResult> Obter(int id, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ObterAsync(usuarioId, id);
        return ParaHttp(resultado, evento => Results.Ok(ParaResposta(evento)));
    }

    private static async Task<IResult> Atualizar(
        int id, AtualizarEventoRequisicao requisicao, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.AtualizarAsync(usuarioId, id, requisicao);
        return ParaHttp(resultado, evento => Results.Ok(ParaResposta(evento)));
    }

    private static async Task<IResult> Excluir(int id, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ExcluirAsync(usuarioId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static EventoResposta ParaResposta(Evento evento) => new(
        evento.Id,
        evento.PlanoAtualId,
        evento.Tipo,
        evento.DataEvento,
        evento.NomeEvento,
        evento.Local,
        evento.SlugPublico,
        evento.Descricao,
        evento.CorPrincipal,
        evento.CorSecundaria,
        evento.CriadoEm);
}
