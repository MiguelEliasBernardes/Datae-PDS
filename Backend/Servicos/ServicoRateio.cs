using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Rateio da formatura: o total das despesas é dividido igualmente entre os formandos, e o
/// financeiro registra o que cada um já pagou. Os valores são sempre calculados na hora,
/// então incluir uma despesa ou um formando atualiza a parte de todo mundo.
/// Quem não é do financeiro vê os totais da turma e só a própria situação: os valores dos
/// colegas são dados financeiros individuais e ficam restritos, conforme a LGPD.
/// </summary>
public class ServicoRateio(ContextoBanco banco)
{
    private const decimal ValorMaximoPagamento = 1_000_000m;

    public async Task<Resultado<RateioResposta>> ObterAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso.Repassar<RateioResposta>();

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

        if (!acesso.Valor!.Pode(Permissao.Financeiro))
            situacoes = situacoes.Where(s => s.FormandoId == acesso.Valor.Formando?.Id).ToList();

        return Resultado<RateioResposta>.Ok(new RateioResposta(
            totalDespesas, formandos.Count, valorPorFormando, totalPago, percentualPago, situacoes));
    }

    /// <summary>Pagamentos de um formando: o financeiro vê os de todos; cada formando, só os dele.</summary>
    public async Task<Resultado<List<PagamentoFormando>>> ListarPagamentosAsync(int usuarioId, int eventoId, int formandoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso.Repassar<List<PagamentoFormando>>();
        if (!acesso.Valor!.Pode(Permissao.Financeiro) && acesso.Valor.Formando?.Id != formandoId)
            return Resultado<List<PagamentoFormando>>.Falha(
                TipoErro.SemPermissao, "Você só pode ver os seus próprios pagamentos.");
        if (!await FormandoDoEventoAsync(eventoId, formandoId))
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
        var acesso = await ExigirFinanceiroAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<PagamentoFormando>();
        if (!await FormandoDoEventoAsync(eventoId, formandoId))
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
        var acesso = await ExigirFinanceiroAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<bool>();

        var pagamento = await banco.PagamentosFormando.FirstOrDefaultAsync(p =>
            p.Id == id &&
            p.FormandoId == formandoId &&
            banco.Formandos.Any(f => f.Id == formandoId && f.EventoId == eventoId));

        if (pagamento is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Pagamento não encontrado.");

        banco.PagamentosFormando.Remove(pagamento);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Parte paga em %, arredondada para baixo e limitada a 100 (quem pagou a mais aparece com 100%).</summary>
    private static int Percentual(decimal pago, decimal total) =>
        (int)Math.Min(100, decimal.Floor(pago / total * 100));

    private Task<Resultado<AcessoEvento>> ExigirFinanceiroAsync(int usuarioId, int eventoId) =>
        ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.Financeiro, somenteFormatura: true);

    // O acesso ao evento já foi conferido pelo ControleAcesso
    private Task<bool> FormandoDoEventoAsync(int eventoId, int formandoId) =>
        banco.Formandos.AnyAsync(f => f.Id == formandoId && f.EventoId == eventoId);
}
