using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoPresente(ContextoBanco banco)
{
    private const int MinimoCotas = 2;
    private const int MaximoCotas = 100;

    public async Task<Resultado<List<ItemPresente>>> ListarAsync(int usuarioId, int eventoId, StatusPresente? status)
    {
        if (!await EventoDoUsuarioAsync(usuarioId, eventoId))
            return Resultado<List<ItemPresente>>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        var consulta = banco.ItensPresente.Where(p => p.EventoId == eventoId);
        if (status is not null)
            consulta = consulta.Where(p => p.Status == status);

        return Resultado<List<ItemPresente>>.Ok(await consulta.OrderBy(p => p.Nome).ToListAsync());
    }

    public async Task<Resultado<ItemPresente>> ObterAsync(int usuarioId, int eventoId, int id)
    {
        var presente = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        return presente is null ? PresenteNaoEncontrado() : Resultado<ItemPresente>.Ok(presente);
    }

    public async Task<Resultado<ItemPresente>> CriarAsync(int usuarioId, int eventoId, CriarPresenteRequisicao requisicao)
    {
        if (!await EventoDoUsuarioAsync(usuarioId, eventoId))
            return Resultado<ItemPresente>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.Nome))
            erros["nome"] = ["Informe o nome do presente."];
        if (requisicao.ValorEstimado < 0)
            erros["valorEstimado"] = ["O valor estimado não pode ser negativo."];

        // 0 ou nulo = presente inteiro
        var quantidadeCotas = requisicao.QuantidadeCotas is int cotas && cotas != 0 ? cotas : (int?)null;
        if (quantidadeCotas is not null)
            ValidarCotas(quantidadeCotas.Value, requisicao.ValorEstimado, erros);

        if (erros.Count > 0)
            return Resultado<ItemPresente>.Invalido(erros);

        var presente = new ItemPresente
        {
            EventoId = eventoId,
            Nome = requisicao.Nome.Trim(),
            Descricao = TextoOpcional(requisicao.Descricao),
            ValorEstimado = requisicao.ValorEstimado,
            LinkAfiliado = TextoOpcional(requisicao.LinkAfiliado),
            Foto = TextoOpcional(requisicao.Foto),
            QuantidadeCotas = quantidadeCotas,
        };

        banco.ItensPresente.Add(presente);
        await banco.SaveChangesAsync();

        return Resultado<ItemPresente>.Ok(presente);
    }

    public async Task<Resultado<ItemPresente>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarPresenteRequisicao requisicao)
    {
        var presente = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (presente is null)
            return PresenteNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Nome is not null)
        {
            if (string.IsNullOrWhiteSpace(requisicao.Nome))
                erros["nome"] = ["O nome não pode ficar vazio."];
            else
                presente.Nome = requisicao.Nome.Trim();
        }

        if (requisicao.ValorEstimado is decimal valor)
        {
            if (valor < 0)
                erros["valorEstimado"] = ["O valor estimado não pode ser negativo."];
            else
                presente.ValorEstimado = valor;
        }

        AplicarCotas(presente, requisicao.QuantidadeCotas, erros);

        // Presente com cotas não tem reserva: o status é calculado pelas cotas vendidas
        if (presente.QuantidadeCotas is not null)
        {
            if (requisicao.ConvidadoId is not null)
                erros["convidadoId"] = ["Um presente dividido em cotas não pode ser reservado para um convidado."];
            if (requisicao.Status is StatusPresente status && status != presente.Status)
                erros["status"] = ["O status de um presente com cotas é calculado pelas cotas vendidas."];
        }
        else
        {
            await AplicarReservaAsync(presente, requisicao.Status, requisicao.ConvidadoId, erros);
        }

        if (requisicao.Descricao is not null)
            presente.Descricao = TextoOpcional(requisicao.Descricao);
        if (requisicao.LinkAfiliado is not null)
            presente.LinkAfiliado = TextoOpcional(requisicao.LinkAfiliado);
        if (requisicao.Foto is not null)
            presente.Foto = TextoOpcional(requisicao.Foto);

        if (erros.Count > 0)
            return Resultado<ItemPresente>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<ItemPresente>.Ok(presente);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var presente = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (presente is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Presente não encontrado.");

        banco.ItensPresente.Remove(presente);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    public async Task<Resultado<List<CotaPresente>>> ListarCotasAsync(int usuarioId, int eventoId, int id)
    {
        if (await BuscarDoUsuarioAsync(usuarioId, eventoId, id) is null)
            return Resultado<List<CotaPresente>>.Falha(TipoErro.NaoEncontrado, "Presente não encontrado.");

        var cotas = await banco.CotasPresente
            .Where(c => c.ItemPresenteId == id)
            .OrderByDescending(c => c.CriadoEm)
            .ToListAsync();

        return Resultado<List<CotaPresente>>.Ok(cotas);
    }

    /// <summary>
    /// Desfaz uma compra de cotas (ex.: o convidado não pagou). As cotas voltam a ficar disponíveis.
    /// A subtração é feita direto no banco, para não perder uma compra feita ao mesmo tempo na página pública.
    /// </summary>
    public async Task<Resultado<ItemPresente>> ExcluirCotaAsync(int usuarioId, int eventoId, int id, int cotaId)
    {
        var presente = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (presente is null)
            return PresenteNaoEncontrado();

        var cota = await banco.CotasPresente.FirstOrDefaultAsync(c => c.Id == cotaId && c.ItemPresenteId == id);
        if (cota is null)
            return Resultado<ItemPresente>.Falha(TipoErro.NaoEncontrado, "Compra de cotas não encontrada.");

        await using var transacao = await banco.Database.BeginTransactionAsync();

        banco.CotasPresente.Remove(cota);
        await banco.SaveChangesAsync();

        await banco.ItensPresente
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.CotasVendidas, p => p.CotasVendidas >= cota.Quantidade ? p.CotasVendidas - cota.Quantidade : 0)
                .SetProperty(p => p.Status, StatusPresente.Disponivel));

        await transacao.CommitAsync();

        await banco.Entry(presente).ReloadAsync();
        return Resultado<ItemPresente>.Ok(presente);
    }

    /// <summary>
    /// Liga, muda ou desliga as cotas. 0 volta a ser presente inteiro (só sem cotas vendidas);
    /// um presente reservado precisa ser liberado antes de ser dividido.
    /// </summary>
    private static void AplicarCotas(ItemPresente presente, int? quantidadeCotas, Dictionary<string, string[]> erros)
    {
        if (quantidadeCotas is int quantidade)
        {
            if (quantidade == 0)
            {
                if (presente.CotasVendidas > 0)
                    erros["quantidadeCotas"] = ["Já foram compradas cotas deste presente. Desfaça as compras antes de tirar as cotas."];
                else
                    presente.QuantidadeCotas = null;
            }
            else if (quantidade is < MinimoCotas or > MaximoCotas)
            {
                erros["quantidadeCotas"] = [$"Divida o presente em {MinimoCotas} a {MaximoCotas} cotas."];
            }
            else if (presente.QuantidadeCotas is null && presente.Status != StatusPresente.Disponivel)
            {
                erros["quantidadeCotas"] = ["Este presente está reservado. Libere a reserva antes de dividir em cotas."];
            }
            else if (quantidade < presente.CotasVendidas)
            {
                erros["quantidadeCotas"] = [$"Já foram compradas {presente.CotasVendidas} cotas; o total não pode ser menor que isso."];
            }
            else
            {
                presente.QuantidadeCotas = quantidade;
                presente.Status = presente.CotasVendidas == quantidade ? StatusPresente.Comprado : StatusPresente.Disponivel;
            }
        }

        // Vale também quando só o valor mudou: dividir um presente exige saber o preço dele
        if (presente.QuantidadeCotas is int cotas && !erros.ContainsKey("quantidadeCotas"))
            ValidarCotas(cotas, presente.ValorEstimado, erros);
    }

    private static void ValidarCotas(int quantidade, decimal? valorEstimado, Dictionary<string, string[]> erros)
    {
        if (quantidade is < MinimoCotas or > MaximoCotas)
            erros["quantidadeCotas"] = [$"Divida o presente em {MinimoCotas} a {MaximoCotas} cotas."];
        if (valorEstimado is not > 0)
            erros["valorEstimado"] = ["Informe o valor do presente para dividir em cotas."];
    }

    /// <summary>
    /// Regras de reserva: informar um convidado reserva o presente para ele (ou marca como
    /// comprado por ele, se o status for Comprado); voltar para Disponivel remove o convidado
    /// e invalida o código de reserva que o convidado recebeu na página pública.
    /// </summary>
    private async Task AplicarReservaAsync(
        ItemPresente presente, StatusPresente? status, int? convidadoId, Dictionary<string, string[]> erros)
    {
        if (status is StatusPresente novoStatus && !Enum.IsDefined(novoStatus))
        {
            erros["status"] = ["Status do presente inválido."];
            return;
        }

        if (convidadoId is int idConvidado)
        {
            if (status == StatusPresente.Disponivel)
            {
                erros["convidadoId"] = ["Um presente disponível não pode ter convidado; remova o convidado ou use o status Reservado."];
                return;
            }

            var convidadoDoEvento = await banco.Convidados
                .AnyAsync(c => c.Id == idConvidado && c.EventoId == presente.EventoId);
            if (!convidadoDoEvento)
            {
                erros["convidadoId"] = ["Convidado não encontrado neste evento."];
                return;
            }

            presente.ConvidadoId = idConvidado;
            presente.Status = status == StatusPresente.Comprado ? StatusPresente.Comprado : StatusPresente.Reservado;
            return;
        }

        if (status == StatusPresente.Disponivel)
        {
            presente.ConvidadoId = null;
            presente.CodigoReserva = null;
            presente.Status = StatusPresente.Disponivel;
        }
        else if (status is StatusPresente novo)
        {
            presente.Status = novo;
        }
    }

    private Task<bool> EventoDoUsuarioAsync(int usuarioId, int eventoId) =>
        banco.Eventos.AnyAsync(e => e.Id == eventoId && e.UsuarioId == usuarioId);

    private Task<ItemPresente?> BuscarDoUsuarioAsync(int usuarioId, int eventoId, int id) =>
        banco.ItensPresente.FirstOrDefaultAsync(p =>
            p.Id == id &&
            p.EventoId == eventoId &&
            banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId));

    private static Resultado<ItemPresente> PresenteNaoEncontrado() =>
        Resultado<ItemPresente>.Falha(TipoErro.NaoEncontrado, "Presente não encontrado.");
}
