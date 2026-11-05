using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoPresente(ContextoBanco banco)
{
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

        await AplicarReservaAsync(presente, requisicao.Status, requisicao.ConvidadoId, erros);

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
