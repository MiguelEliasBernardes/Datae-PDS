using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas dos módulos de formatura: formandos, despesas e rateio (com os pagamentos de cada formando).
/// Ficam "dentro" do evento e só funcionam em eventos do tipo Formatura (os outros respondem 409).
/// </summary>
public static class RotasFormatura
{
    public static void MapearRotasFormatura(this WebApplication app)
    {
        var formandos = app.MapGroup("/api/eventos/{eventoId:int}/formandos")
            .WithTags("Formandos")
            .RequireAuthorization();

        formandos.MapGet("/", ListarFormandos);
        formandos.MapPost("/", CriarFormando);
        formandos.MapPut("/{id:int}", AtualizarFormando);
        formandos.MapDelete("/{id:int}", ExcluirFormando);

        formandos.MapGet("/{formandoId:int}/pagamentos", ListarPagamentos);
        formandos.MapPost("/{formandoId:int}/pagamentos", RegistrarPagamento);
        formandos.MapDelete("/{formandoId:int}/pagamentos/{id:int}", ExcluirPagamento);

        var despesas = app.MapGroup("/api/eventos/{eventoId:int}/despesas")
            .WithTags("Despesas")
            .RequireAuthorization();

        despesas.MapGet("/", ListarDespesas);
        despesas.MapPost("/", CriarDespesa);
        despesas.MapPut("/{id:int}", AtualizarDespesa);
        despesas.MapDelete("/{id:int}", ExcluirDespesa);

        app.MapGet("/api/eventos/{eventoId:int}/rateio", ObterRateio).WithTags("Rateio").RequireAuthorization();
    }

    // ===== Formandos =====

    // Filtro opcional: /formandos?papel=Administrador
    private static async Task<IResult> ListarFormandos(
        int eventoId, PapelFormando? papel, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ListarAsync(usuarioId, eventoId, papel);
        return ParaHttp(resultado, lista => Results.Ok(lista.Select(ParaResposta)));
    }

    private static async Task<IResult> CriarFormando(
        int eventoId, CriarFormandoRequisicao requisicao, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.CriarAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, formando =>
            Results.Created($"/api/eventos/{eventoId}/formandos/{formando.Id}", ParaResposta(formando)));
    }

    private static async Task<IResult> AtualizarFormando(
        int eventoId, int id, AtualizarFormandoRequisicao requisicao, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AtualizarAsync(usuarioId, eventoId, id, requisicao);
        return ParaHttp(resultado, formando => Results.Ok(ParaResposta(formando)));
    }

    private static async Task<IResult> ExcluirFormando(int eventoId, int id, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ExcluirAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    // ===== Pagamentos do rateio =====

    private static async Task<IResult> ListarPagamentos(
        int eventoId, int formandoId, ClaimsPrincipal principal, ServicoRateio servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ListarPagamentosAsync(usuarioId, eventoId, formandoId);
        return ParaHttp(resultado, lista => Results.Ok(lista.Select(ParaResposta)));
    }

    private static async Task<IResult> RegistrarPagamento(
        int eventoId, int formandoId, RegistrarPagamentoRequisicao requisicao, ClaimsPrincipal principal, ServicoRateio servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.RegistrarPagamentoAsync(usuarioId, eventoId, formandoId, requisicao);
        return ParaHttp(resultado, pagamento => Results.Created(
            $"/api/eventos/{eventoId}/formandos/{formandoId}/pagamentos/{pagamento.Id}", ParaResposta(pagamento)));
    }

    private static async Task<IResult> ExcluirPagamento(
        int eventoId, int formandoId, int id, ClaimsPrincipal principal, ServicoRateio servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ExcluirPagamentoAsync(usuarioId, eventoId, formandoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    // ===== Despesas =====

    private static async Task<IResult> ListarDespesas(int eventoId, ClaimsPrincipal principal, ServicoDespesa servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ListarAsync(usuarioId, eventoId);
        return ParaHttp(resultado, lista => Results.Ok(lista.Select(ParaResposta)));
    }

    private static async Task<IResult> CriarDespesa(
        int eventoId, CriarDespesaRequisicao requisicao, ClaimsPrincipal principal, ServicoDespesa servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.CriarAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, despesa =>
            Results.Created($"/api/eventos/{eventoId}/despesas/{despesa.Id}", ParaResposta(despesa)));
    }

    private static async Task<IResult> AtualizarDespesa(
        int eventoId, int id, AtualizarDespesaRequisicao requisicao, ClaimsPrincipal principal, ServicoDespesa servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AtualizarAsync(usuarioId, eventoId, id, requisicao);
        return ParaHttp(resultado, despesa => Results.Ok(ParaResposta(despesa)));
    }

    private static async Task<IResult> ExcluirDespesa(int eventoId, int id, ClaimsPrincipal principal, ServicoDespesa servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ExcluirAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    // ===== Rateio =====

    private static async Task<IResult> ObterRateio(int eventoId, ClaimsPrincipal principal, ServicoRateio servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ObterAsync(usuarioId, eventoId);
        return ParaHttp(resultado, Results.Ok);
    }

    private static FormandoResposta ParaResposta(Formando formando) => new(
        formando.Id, formando.EventoId, formando.Nome, formando.Email, formando.Papel, formando.CriadoEm);

    private static DespesaResposta ParaResposta(Despesa despesa) => new(
        despesa.Id, despesa.EventoId, despesa.Descricao, despesa.Valor, despesa.Data, despesa.CriadoEm);

    private static PagamentoResposta ParaResposta(PagamentoFormando pagamento) => new(
        pagamento.Id, pagamento.FormandoId, pagamento.Valor, pagamento.PagoEm, pagamento.Observacao);
}
