using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoConvidado(ContextoBanco banco)
{
    public async Task<Resultado<List<Convidado>>> ListarAsync(int usuarioId, int eventoId, StatusPresenca? status)
    {
        if (!await EventoDoUsuarioAsync(usuarioId, eventoId))
            return Resultado<List<Convidado>>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        var consulta = banco.Convidados.Where(c => c.EventoId == eventoId);
        if (status is not null)
            consulta = consulta.Where(c => c.StatusPresenca == status);

        return Resultado<List<Convidado>>.Ok(await consulta.OrderBy(c => c.Nome).ToListAsync());
    }

    public async Task<Resultado<Convidado>> ObterAsync(int usuarioId, int eventoId, int id)
    {
        var convidado = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        return convidado is null ? ConvidadoNaoEncontrado() : Resultado<Convidado>.Ok(convidado);
    }

    public async Task<Resultado<Convidado>> CriarAsync(int usuarioId, int eventoId, CriarConvidadoRequisicao requisicao)
    {
        if (!await EventoDoUsuarioAsync(usuarioId, eventoId))
            return Resultado<Convidado>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.Nome))
            erros["nome"] = ["Informe o nome do convidado."];
        if (email is not null && !EmailValido(email))
            erros["email"] = ["Informe um e-mail válido."];
        if (requisicao.StatusPresenca is StatusPresenca status && !Enum.IsDefined(status))
            erros["statusPresenca"] = ["Status de presença inválido."];
        if (requisicao.QuantidadeAcompanhantes < 0)
            erros["quantidadeAcompanhantes"] = ["A quantidade de acompanhantes não pode ser negativa."];

        if (erros.Count > 0)
            return Resultado<Convidado>.Invalido(erros);

        var convidado = new Convidado
        {
            EventoId = eventoId,
            Nome = requisicao.Nome.Trim(),
            Email = email,
            StatusPresenca = requisicao.StatusPresenca ?? StatusPresenca.Pendente,
            QuantidadeAcompanhantes = requisicao.QuantidadeAcompanhantes ?? 0,
            Observacao = TextoOpcional(requisicao.Observacao),
        };

        banco.Convidados.Add(convidado);
        await banco.SaveChangesAsync();

        return Resultado<Convidado>.Ok(convidado);
    }

    public async Task<Resultado<Convidado>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarConvidadoRequisicao requisicao)
    {
        var convidado = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (convidado is null)
            return ConvidadoNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Nome is not null)
        {
            if (string.IsNullOrWhiteSpace(requisicao.Nome))
                erros["nome"] = ["O nome não pode ficar vazio."];
            else
                convidado.Nome = requisicao.Nome.Trim();
        }

        if (requisicao.Email is not null)
        {
            var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
            if (email is not null && !EmailValido(email))
                erros["email"] = ["Informe um e-mail válido."];
            else
                convidado.Email = email;
        }

        if (requisicao.StatusPresenca is StatusPresenca status)
        {
            if (!Enum.IsDefined(status))
                erros["statusPresenca"] = ["Status de presença inválido."];
            else
                convidado.StatusPresenca = status;
        }

        if (requisicao.QuantidadeAcompanhantes is int quantidade)
        {
            if (quantidade < 0)
                erros["quantidadeAcompanhantes"] = ["A quantidade de acompanhantes não pode ser negativa."];
            else
                convidado.QuantidadeAcompanhantes = quantidade;
        }

        if (requisicao.Observacao is not null)
            convidado.Observacao = TextoOpcional(requisicao.Observacao);

        if (erros.Count > 0)
            return Resultado<Convidado>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Convidado>.Ok(convidado);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var convidado = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (convidado is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Convidado não encontrado.");

        // Presentes reservados por ele ficam sem convidado (SetNull no banco)
        banco.Convidados.Remove(convidado);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    private Task<bool> EventoDoUsuarioAsync(int usuarioId, int eventoId) =>
        banco.Eventos.AnyAsync(e => e.Id == eventoId && e.UsuarioId == usuarioId);

    private Task<Convidado?> BuscarDoUsuarioAsync(int usuarioId, int eventoId, int id) =>
        banco.Convidados.FirstOrDefaultAsync(c =>
            c.Id == id &&
            c.EventoId == eventoId &&
            banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId));

    private static Resultado<Convidado> ConvidadoNaoEncontrado() =>
        Resultado<Convidado>.Falha(TipoErro.NaoEncontrado, "Convidado não encontrado.");
}
