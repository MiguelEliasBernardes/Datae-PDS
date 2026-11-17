using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de presente: só recebem a requisição, chamam o ServicoPresente e traduzem o resultado para HTTP.
/// Ficam "dentro" do evento, em duas listas com as mesmas operações:
/// /api/eventos/{eventoId}/presentes (lista do evento) e /api/eventos/{eventoId}/meus-presentes
/// (lista pessoal do formando logado, que aparece na sub-página dele).
/// </summary>
public static class RotasPresente
{
    public static void MapearRotasPresente(this WebApplication app)
    {
        MapearLista(
            app.MapGroup("/api/eventos/{eventoId:int}/presentes").WithTags("Presentes").RequireAuthorization(),
            minhaLista: false);
        MapearLista(
            app.MapGroup("/api/eventos/{eventoId:int}/meus-presentes").WithTags("Presentes").RequireAuthorization(),
            minhaLista: true);
    }

    private static void MapearLista(RouteGroupBuilder presentes, bool minhaLista)
    {
        // Filtro opcional: /presentes?status=Disponivel
        presentes.MapGet("/", (int eventoId, StatusPresente? status, ClaimsPrincipal principal, ServicoPresente servico) =>
            Listar(eventoId, minhaLista, status, principal, servico));
        presentes.MapPost("/", (int eventoId, CriarPresenteRequisicao requisicao, ClaimsPrincipal principal, ServicoPresente servico) =>
            Criar(eventoId, minhaLista, requisicao, principal, servico));
        presentes.MapGet("/{id:int}", (int eventoId, int id, ClaimsPrincipal principal, ServicoPresente servico) =>
            Obter(eventoId, minhaLista, id, principal, servico));
        presentes.MapPut("/{id:int}", (int eventoId, int id, AtualizarPresenteRequisicao requisicao, ClaimsPrincipal principal, ServicoPresente servico) =>
            Atualizar(eventoId, minhaLista, id, requisicao, principal, servico));
        presentes.MapDelete("/{id:int}", (int eventoId, int id, ClaimsPrincipal principal, ServicoPresente servico) =>
            Excluir(eventoId, minhaLista, id, principal, servico));

        // Compras de cotas feitas pelos convidados na página pública
        presentes.MapGet("/{id:int}/cotas", (int eventoId, int id, ClaimsPrincipal principal, ServicoPresente servico) =>
            ListarCotas(eventoId, minhaLista, id, principal, servico));
        presentes.MapDelete("/{id:int}/cotas/{cotaId:int}", (int eventoId, int id, int cotaId, ClaimsPrincipal principal, ServicoPresente servico) =>
            ExcluirCota(eventoId, minhaLista, id, cotaId, principal, servico));
    }

    private static async Task<IResult> Listar(
        int eventoId, bool minhaLista, StatusPresente? status, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ListarAsync(usuarioId, eventoId, minhaLista, status);
        return ParaHttp(resultado, presentes => Results.Ok(presentes.Select(ParaResposta)));
    }

    private static async Task<IResult> Criar(
        int eventoId, bool minhaLista, CriarPresenteRequisicao requisicao, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.CriarAsync(usuarioId, eventoId, minhaLista, requisicao);
        var caminho = minhaLista ? "meus-presentes" : "presentes";
        return ParaHttp(resultado, presente =>
            Results.Created($"/api/eventos/{eventoId}/{caminho}/{presente.Id}", ParaResposta(presente)));
    }

    private static async Task<IResult> Obter(
        int eventoId, bool minhaLista, int id, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ObterAsync(usuarioId, eventoId, minhaLista, id);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> Atualizar(
        int eventoId,
        bool minhaLista,
        int id,
        AtualizarPresenteRequisicao requisicao,
        ClaimsPrincipal principal,
        ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.AtualizarAsync(usuarioId, eventoId, minhaLista, id, requisicao);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> Excluir(
        int eventoId, bool minhaLista, int id, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ExcluirAsync(usuarioId, eventoId, minhaLista, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static async Task<IResult> ListarCotas(
        int eventoId, bool minhaLista, int id, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ListarCotasAsync(usuarioId, eventoId, minhaLista, id);
        return ParaHttp(resultado, cotas => Results.Ok(cotas.Select(c => new CotaPresenteResposta(
            c.Id, c.ItemPresenteId, c.ConvidadoId, c.NomeConvidado, c.Quantidade, c.Valor, c.CriadoEm))));
    }

    // Devolve o presente atualizado (com as cotas liberadas)
    private static async Task<IResult> ExcluirCota(
        int eventoId, bool minhaLista, int id, int cotaId, ClaimsPrincipal principal, ServicoPresente servicoPresente)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoPresente.ExcluirCotaAsync(usuarioId, eventoId, minhaLista, id, cotaId);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
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
        presente.Foto,
        presente.QuantidadeCotas,
        presente.CotasVendidas,
        presente.ValorCota);
}
