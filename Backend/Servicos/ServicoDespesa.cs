using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Despesas de uma formatura. O total é dividido entre os formandos no rateio.
/// Todo participante vê as despesas (são da turma toda); só o financeiro lança e altera.
/// </summary>
public class ServicoDespesa(ContextoBanco banco)
{
    private const decimal ValorMaximo = 10_000_000m;

    public async Task<Resultado<List<Despesa>>> ListarAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso.Repassar<List<Despesa>>();

        // Com data primeiro (da mais próxima para a mais distante), depois as sem data
        var despesas = await banco.Despesas
            .Where(d => d.EventoId == eventoId)
            .OrderBy(d => d.Data == null)
            .ThenBy(d => d.Data)
            .ThenBy(d => d.CriadoEm)
            .ToListAsync();

        return Resultado<List<Despesa>>.Ok(despesas);
    }

    public async Task<Resultado<Despesa>> CriarAsync(int usuarioId, int eventoId, CriarDespesaRequisicao requisicao)
    {
        var acesso = await ExigirFinanceiroAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Despesa>();

        var descricao = (requisicao.Descricao ?? string.Empty).Trim();
        var erros = new Dictionary<string, string[]>();

        ValidarDescricao(descricao, erros);
        ValidarValor(requisicao.Valor, erros);

        if (erros.Count > 0)
            return Resultado<Despesa>.Invalido(erros);

        var despesa = new Despesa
        {
            EventoId = eventoId,
            Descricao = descricao,
            Valor = requisicao.Valor,
            Data = requisicao.Data is DateTime data ? ParaUtc(data) : null,
        };

        banco.Despesas.Add(despesa);
        await banco.SaveChangesAsync();

        return Resultado<Despesa>.Ok(despesa);
    }

    public async Task<Resultado<Despesa>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarDespesaRequisicao requisicao)
    {
        var acesso = await ExigirFinanceiroAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Despesa>();

        var despesa = await BuscarAsync(eventoId, id);
        if (despesa is null)
            return DespesaNaoEncontrada();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Descricao is not null)
        {
            var descricao = requisicao.Descricao.Trim();
            ValidarDescricao(descricao, erros);
            if (!erros.ContainsKey("descricao"))
                despesa.Descricao = descricao;
        }

        if (requisicao.Valor is decimal valor)
        {
            ValidarValor(valor, erros);
            if (!erros.ContainsKey("valor"))
                despesa.Valor = valor;
        }

        if (requisicao.Data is DateTime data)
            despesa.Data = ParaUtc(data);

        if (erros.Count > 0)
            return Resultado<Despesa>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Despesa>.Ok(despesa);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirFinanceiroAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<bool>();

        var despesa = await BuscarAsync(eventoId, id);
        if (despesa is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Despesa não encontrada.");

        banco.Despesas.Remove(despesa);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    private static void ValidarDescricao(string descricao, Dictionary<string, string[]> erros)
    {
        if (descricao.Length == 0)
            erros["descricao"] = ["Informe a descrição da despesa."];
        else if (descricao.Length > 200)
            erros["descricao"] = ["A descrição pode ter no máximo 200 caracteres."];
    }

    private static void ValidarValor(decimal valor, Dictionary<string, string[]> erros)
    {
        if (valor <= 0 || valor > ValorMaximo || decimal.Round(valor, 2) != valor)
            erros["valor"] = ["Informe um valor maior que zero, com no máximo 2 casas decimais."];
    }

    private Task<Resultado<AcessoEvento>> ExigirFinanceiroAsync(int usuarioId, int eventoId) =>
        ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.Financeiro, somenteFormatura: true);

    // O acesso ao evento já foi conferido pelo ControleAcesso
    private Task<Despesa?> BuscarAsync(int eventoId, int id) =>
        banco.Despesas.FirstOrDefaultAsync(d => d.Id == id && d.EventoId == eventoId);

    private static Resultado<Despesa> DespesaNaoEncontrada() =>
        Resultado<Despesa>.Falha(TipoErro.NaoEncontrado, "Despesa não encontrada.");
}
