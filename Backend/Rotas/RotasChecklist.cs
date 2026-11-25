using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas da checklist do evento: só recebem a requisição, chamam o ServicoChecklist e traduzem o resultado para HTTP.
/// Ficam "dentro" do evento: /api/eventos/{eventoId}/checklist. As alterações devolvem a checklist inteira.
/// </summary>
public static class RotasChecklist
{
    public static void MapearRotasChecklist(this WebApplication app)
    {
        var checklist = app.MapGroup("/api/eventos/{eventoId:int}/checklist")
            .WithTags("Checklist")
            .RequireAuthorization();

        checklist.MapGet("/", Obter);
        checklist.MapPost("/itens", CriarItem);
        checklist.MapPut("/itens/{id:int}", AtualizarItem);
        checklist.MapDelete("/itens/{id:int}", ExcluirItem);
        checklist.MapPost("/itens/{id:int}/presente", AdicionarComoPresente);
    }

    private static async Task<IResult> Obter(int eventoId, ClaimsPrincipal principal, ServicoChecklist servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ObterAsync(usuarioId, eventoId);
        return ParaHttp(resultado, checklist => Results.Ok(ParaResposta(checklist)));
    }

    private static async Task<IResult> CriarItem(
        int eventoId, CriarItemChecklistRequisicao requisicao, ClaimsPrincipal principal, ServicoChecklist servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.CriarItemAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, checklist => Results.Ok(ParaResposta(checklist)));
    }

    private static async Task<IResult> AtualizarItem(
        int eventoId, int id, AtualizarItemChecklistRequisicao requisicao, ClaimsPrincipal principal, ServicoChecklist servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AtualizarItemAsync(usuarioId, eventoId, id, requisicao);
        return ParaHttp(resultado, checklist => Results.Ok(ParaResposta(checklist)));
    }

    private static async Task<IResult> ExcluirItem(int eventoId, int id, ClaimsPrincipal principal, ServicoChecklist servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ExcluirItemAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, checklist => Results.Ok(ParaResposta(checklist)));
    }

    private static async Task<IResult> AdicionarComoPresente(int eventoId, int id, ClaimsPrincipal principal, ServicoChecklist servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AdicionarComoPresenteAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, checklist => Results.Ok(ParaResposta(checklist)));
    }

    private static ChecklistResposta ParaResposta(Checklist checklist)
    {
        var acesso = checklist.Acesso;
        var gerencia = acesso.Pode(Permissao.GerenciarEvento);
        var dataEvento = acesso.Evento.DataEvento;
        var podeVirarPresente = gerencia && acesso.Evento.Tipo != TipoEvento.Formatura;

        var itens = checklist.Itens.Select(item => new ItemChecklistResposta(
            item.Id,
            item.Titulo,
            item.Descricao,
            item.Categoria,
            item.DiasAntes,
            item.DiasAntes is int dias ? dataEvento.AddDays(-dias) : null,
            item.Concluido,
            item.ConcluidoEm,
            item.Origem,
            item.ResponsavelFormandoId,
            item.ResponsavelFormandoId is int responsavel ? checklist.NomesFormandos.GetValueOrDefault(responsavel) : null,
            gerencia || ServicoChecklist.EhResponsavel(acesso, item),
            podeVirarPresente && item.Categoria == CategoriaChecklist.Itens && !item.Concluido)).ToList();

        return new ChecklistResposta(itens, checklist.Dicas, gerencia);
    }
}
