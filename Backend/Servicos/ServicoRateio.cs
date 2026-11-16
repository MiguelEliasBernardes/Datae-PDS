using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Rateio da formatura: o total das despesas é dividido igualmente entre os formandos, e o
/// organizador registra o que cada um já pagou. Os valores são sempre calculados na hora,
/// então incluir uma despesa ou um formando atualiza a parte de todo mundo.
/// </summary>
public class ServicoRateio(ContextoBanco banco)
{
    private const decimal ValorMaximoPagamento = 1_000_000m;

    public async Task<Resultado<RateioResposta>> ObterAsync(int usuarioId, int eventoId)
    {
        if (await AcessoFormatura.ConferirAsync(banco, usuarioId, eventoId) is { } falha)
            return Resultado<RateioResposta>.Falha(falha.Erro, falha.Mensagem);

        var totalDespesas = await banco.Despesas.Where(d => d.EventoId == eventoId).SumAsync(d => d.Valor);
        var formandos = await banco.Formandos.Where(f => f.EventoId == eventoId).OrderBy(f => f.Nome).ToListAsync();

        var pagoPorFormando = await banco.PagamentosFormando
            .Where(p => banco.Formandos.Any(f => f.Id == p.FormandoId && f.EventoId == eventoId))
            .GroupBy(p => p.FormandoId)
            .Select(g => new { FormandoId = g.Key, Total = g.Sum(p => p.Valor) })
            .ToDictionaryAsync(g => g.FormandoId, g => g.Total);

        var valorPorFormando = formandos.Count > 0
            ? decimal.Round(totalDespesas / formandos.Count, 2, MidpointRounding.AwayFromZero)
            : 0;

        var situacoes = formandos.Select(f =>
        {
            var pago = pagoPorFormando.GetValueOrDefault(f.Id);
            // Sem despesas, ninguém deve nada: o formando aparece como quitado
            var percentual = valorPorFormando > 0 ? Percentual(pago, valorPorFormando) : 100;
            return new RateioFormandoResposta(f.Id, f.Nome, f.Papel, pago, valorPorFormando, percentual, pago >= valorPorFormando);
        }).ToList();

        var totalPago = pagoPorFormando.Values.Sum();
        var percentualPago = totalDespesas > 0 ? Percentual(totalPago, totalDespesas) : 0;

        return Resultado<RateioResposta>.Ok(new RateioResposta(
            totalDespesas, formandos.Count, valorPorFormando, totalPago, percentualPago, situacoes));
    }

    public async Task<Resultado<List<PagamentoFormando>>> ListarPagamentosAsync(int usuarioId, int eventoId, int formandoId)
    {
        if (!await FormandoDoUsuarioAsync(usuarioId, eventoId, formandoId))
            return Resultado<List<PagamentoFormando>>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");

        var pagamentos = await banco.PagamentosFormando
            .Where(p => p.FormandoId == formandoId)
            .OrderByDescending(p => p.PagoEm)
            .ToListAsync();

        return Resultado<List<PagamentoFormando>>.Ok(pagamentos);
    }

    public async Task<Resultado<PagamentoFormando>> RegistrarPagamentoAsync(
        int usuarioId, int eventoId, int formandoId, RegistrarPagamentoRequisicao requisicao)
    {
        if (!await FormandoDoUsuarioAsync(usuarioId, eventoId, formandoId))
            return Resultado<PagamentoFormando>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");

        var observacao = TextoOpcional(requisicao.Observacao);
        var erros = new Dictionary<string, string[]>();

        if (requisicao.Valor <= 0 || requisicao.Valor > ValorMaximoPagamento || decimal.Round(requisicao.Valor, 2) != requisicao.Valor)
            erros["valor"] = ["Informe um valor maior que zero, com no máximo 2 casas decimais."];
        if (observacao?.Length > 500)
            erros["observacao"] = ["A observação pode ter no máximo 500 caracteres."];

        if (erros.Count > 0)
            return Resultado<PagamentoFormando>.Invalido(erros);

        var pagamento = new PagamentoFormando
        {
            FormandoId = formandoId,
            Valor = requisicao.Valor,
            PagoEm = requisicao.PagoEm is DateTime data ? ParaUtc(data) : DateTime.UtcNow,
            Observacao = observacao,
        };

        banco.PagamentosFormando.Add(pagamento);
        await banco.SaveChangesAsync();

        return Resultado<PagamentoFormando>.Ok(pagamento);
    }

    public async Task<Resultado<bool>> ExcluirPagamentoAsync(int usuarioId, int eventoId, int formandoId, int id)
    {
        var pagamento = await banco.PagamentosFormando.FirstOrDefaultAsync(p =>
            p.Id == id &&
            p.FormandoId == formandoId &&
            banco.Formandos.Any(f => f.Id == formandoId && f.EventoId == eventoId &&
                banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId)));

        if (pagamento is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Pagamento não encontrado.");

        banco.PagamentosFormando.Remove(pagamento);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Parte paga em %, arredondada para baixo e limitada a 100 (quem pagou a mais aparece com 100%).</summary>
    private static int Percentual(decimal pago, decimal total) =>
        (int)Math.Min(100, decimal.Floor(pago / total * 100));

    private Task<bool> FormandoDoUsuarioAsync(int usuarioId, int eventoId, int formandoId) =>
        banco.Formandos.AnyAsync(f =>
            f.Id == formandoId &&
            f.EventoId == eventoId &&
            banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId));
}
