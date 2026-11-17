using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas dos módulos de formatura: formandos (com convites), despesas e rateio (com os pagamentos de cada formando).
/// Ficam "dentro" do evento e só funcionam em eventos do tipo Formatura (os outros respondem 409).
/// O que cada participante pode fazer depende do papel dele na comissão (ver ControleAcesso).
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

        // Convite individual: gerar outro código ou tirar o acesso de quem entrou
        formandos.MapPost("/{id:int}/convite", GerarNovoConvite);
        formandos.MapDelete("/{id:int}/vinculo", Desvincular);

        // O formando ligado à conta logada (sub-página dele)
        formandos.MapGet("/eu", ObterMeuFormando);
        formandos.MapPut("/eu", AtualizarMeuFormando);

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

        // Código geral de convite da turma: POST liga ou troca, DELETE desliga. Devolvem o evento atualizado
        var codigoTurma = app.MapGroup("/api/eventos/{eventoId:int}/codigo-turma").WithTags("Formandos").RequireAuthorization();
        codigoTurma.MapPost("/", GerarCodigoTurma);
        codigoTurma.MapDelete("/", DesativarCodigoTurma);
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

    private static async Task<IResult> GerarNovoConvite(int eventoId, int id, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.GerarNovoConviteAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, formando => Results.Ok(ParaResposta(formando)));
    }

    private static async Task<IResult> Desvincular(int eventoId, int id, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.DesvincularAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, formando => Results.Ok(ParaResposta(formando)));
    }

    private static async Task<IResult> ObterMeuFormando(int eventoId, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.ObterMeuAsync(usuarioId, eventoId);
        return ParaHttp(resultado, formando => Results.Ok(ParaResposta(formando)));
    }

    private static async Task<IResult> AtualizarMeuFormando(
        int eventoId, AtualizarMeuFormandoRequisicao requisicao, ClaimsPrincipal principal, ServicoFormando servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.AtualizarMeuAsync(usuarioId, eventoId, requisicao);
        return ParaHttp(resultado, formando => Results.Ok(ParaResposta(formando)));
    }

    private static async Task<IResult> GerarCodigoTurma(int eventoId, ClaimsPrincipal principal, ServicoConvite servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.GerarCodigoTurmaAsync(usuarioId, eventoId);
        return ParaHttp(resultado, acesso => Results.Ok(RotasEvento.ParaResposta(acesso)));
    }

    private static async Task<IResult> DesativarCodigoTurma(int eventoId, ClaimsPrincipal principal, ServicoConvite servico)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servico.DesativarCodigoTurmaAsync(usuarioId, eventoId);
        return ParaHttp(resultado, acesso => Results.Ok(RotasEvento.ParaResposta(acesso)));
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
        formando.Id,
        formando.EventoId,
        formando.Nome,
        formando.Email,
        formando.Papel,
        formando.CriadoEm,
        formando.Slug,
        formando.Mensagem,
        formando.UsuarioId is not null,
        formando.CodigoConvite);

    private static DespesaResposta ParaResposta(Despesa despesa) => new(
        despesa.Id, despesa.EventoId, despesa.Descricao, despesa.Valor, despesa.Data, despesa.CriadoEm);

    private static PagamentoResposta ParaResposta(PagamentoFormando pagamento) => new(
        pagamento.Id, pagamento.FormandoId, pagamento.Valor, pagamento.PagoEm, pagamento.Observacao);
}
