using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Relatório dos Pix avisados pelos convidados (Financeiro > Pix). Como o Pix é estático, cada aviso chega
/// aguardando conferência: quem tem a permissão Financeiro marca como conferido depois de ver no extrato,
/// ou exclui um aviso falso. Toda alteração devolve o relatório inteiro, com os totais atualizados.
/// </summary>
public class ServicoPixInformado(ContextoBanco banco)
{
    public async Task<Resultado<RelatorioPixResposta>> ObterRelatorioAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.Financeiro);
        if (!acesso.Sucesso)
            return acesso.Repassar<RelatorioPixResposta>();

        return Resultado<RelatorioPixResposta>.Ok(await MontarAsync(acesso.Valor!.Evento));
    }

    public async Task<Resultado<RelatorioPixResposta>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarPixInformadoRequisicao requisicao)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.Financeiro);
        if (!acesso.Sucesso)
            return acesso.Repassar<RelatorioPixResposta>();

        var pix = await banco.PixInformados.FirstOrDefaultAsync(p => p.Id == id && p.EventoId == eventoId);
        if (pix is null)
            return PixNaoEncontrado();

        if (pix.Conferido != requisicao.Conferido)
        {
            pix.Conferido = requisicao.Conferido;
            pix.ConferidoEm = requisicao.Conferido ? DateTime.UtcNow : null;
            await banco.SaveChangesAsync();
        }

        return Resultado<RelatorioPixResposta>.Ok(await MontarAsync(acesso.Valor!.Evento));
    }

    /// <summary>Exclui um aviso (ex.: o Pix nunca caiu). A compra de cotas, se houver, continua: ela é desfeita em Presentes.</summary>
    public async Task<Resultado<RelatorioPixResposta>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.Financeiro);
        if (!acesso.Sucesso)
            return acesso.Repassar<RelatorioPixResposta>();

        var excluidos = await banco.PixInformados.Where(p => p.Id == id && p.EventoId == eventoId).ExecuteDeleteAsync();
        if (excluidos == 0)
            return PixNaoEncontrado();

        return Resultado<RelatorioPixResposta>.Ok(await MontarAsync(acesso.Valor!.Evento));
    }

    private async Task<RelatorioPixResposta> MontarAsync(Evento evento)
    {
        var avisos = await banco.PixInformados.AsNoTracking()
            .Where(p => p.EventoId == evento.Id)
            .OrderByDescending(p => p.InformadoEm)
            .ToListAsync();

        // Detalhe de cada aviso: as cotas de qual presente, ou a lista de qual formando
        var idsCotas = avisos.Where(p => p.CotaPresenteId is not null).Select(p => p.CotaPresenteId!.Value).ToList();
        var cotas = await (
                from c in banco.CotasPresente
                join p in banco.ItensPresente on c.ItemPresenteId equals p.Id
                where idsCotas.Contains(c.Id)
                select new { c.Id, c.Quantidade, Presente = p.Nome })
            .ToDictionaryAsync(c => c.Id);
        var nomesFormandos = await banco.Formandos
            .Where(f => f.EventoId == evento.Id)
            .ToDictionaryAsync(f => f.Id, f => f.Nome);

        var itens = avisos.Select(p =>
        {
            string? detalhe = null;
            if (p.CotaPresenteId is int cotaId && cotas.TryGetValue(cotaId, out var cota))
                detalhe = $"{(cota.Quantidade == 1 ? "1 cota" : $"{cota.Quantidade} cotas")} de {cota.Presente}";
            else if (p.FormandoId is int formandoId && nomesFormandos.TryGetValue(formandoId, out var formando))
                detalhe = $"Lista de {formando}";

            return new PixInformadoResposta(
                p.Id,
                p.NomeConvidado,
                p.Valor,
                p.Recado,
                p.CotaPresenteId is null ? OrigemPix.Livre : OrigemPix.Cotas,
                detalhe,
                p.Conferido,
                p.InformadoEm,
                p.ConferidoEm);
        }).ToList();

        return new RelatorioPixResposta(
            itens,
            itens.Sum(p => p.Valor),
            itens.Where(p => p.Conferido).Sum(p => p.Valor),
            itens.Count(p => !p.Conferido),
            evento.ChavePix is not null && evento.NomeRecebedorPix is not null && evento.CidadePix is not null);
    }

    private static Resultado<RelatorioPixResposta> PixNaoEncontrado() =>
        Resultado<RelatorioPixResposta>.Falha(TipoErro.NaoEncontrado, "Aviso de Pix não encontrado.");
}
