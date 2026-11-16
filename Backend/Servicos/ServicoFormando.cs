using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>Integrantes da turma de uma formatura. Só funciona em eventos do tipo Formatura.</summary>
public class ServicoFormando(ContextoBanco banco)
{
    public async Task<Resultado<List<Formando>>> ListarAsync(int usuarioId, int eventoId, PapelFormando? papel)
    {
        if (await AcessoFormatura.ConferirAsync(banco, usuarioId, eventoId) is { } falha)
            return Resultado<List<Formando>>.Falha(falha.Erro, falha.Mensagem);

        var consulta = banco.Formandos.Where(f => f.EventoId == eventoId);
        if (papel is not null)
            consulta = consulta.Where(f => f.Papel == papel);

        return Resultado<List<Formando>>.Ok(await consulta.OrderBy(f => f.Nome).ToListAsync());
    }

    public async Task<Resultado<Formando>> CriarAsync(int usuarioId, int eventoId, CriarFormandoRequisicao requisicao)
    {
        if (await AcessoFormatura.ConferirAsync(banco, usuarioId, eventoId) is { } falha)
            return Resultado<Formando>.Falha(falha.Erro, falha.Mensagem);

        var nome = NormalizarNome(requisicao.Nome);
        var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
        var erros = new Dictionary<string, string[]>();

        ValidarNome(nome, erros);
        if (email is not null && !EmailValido(email))
            erros["email"] = ["Informe um e-mail válido."];
        if (requisicao.Papel is PapelFormando papel && !Enum.IsDefined(papel))
            erros["papel"] = ["Papel inválido."];

        if (erros.Count > 0)
            return Resultado<Formando>.Invalido(erros);

        var formando = new Formando
        {
            EventoId = eventoId,
            Nome = nome,
            Email = email,
            Papel = requisicao.Papel ?? PapelFormando.Membro,
        };

        banco.Formandos.Add(formando);
        await banco.SaveChangesAsync();

        return Resultado<Formando>.Ok(formando);
    }

    public async Task<Resultado<Formando>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarFormandoRequisicao requisicao)
    {
        var formando = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (formando is null)
            return FormandoNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Nome is not null)
        {
            var nome = NormalizarNome(requisicao.Nome);
            ValidarNome(nome, erros);
            if (!erros.ContainsKey("nome"))
                formando.Nome = nome;
        }

        if (requisicao.Email is not null)
        {
            var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
            if (email is not null && !EmailValido(email))
                erros["email"] = ["Informe um e-mail válido."];
            else
                formando.Email = email;
        }

        if (requisicao.Papel is PapelFormando papel)
        {
            if (!Enum.IsDefined(papel))
                erros["papel"] = ["Papel inválido."];
            else
                formando.Papel = papel;
        }

        if (erros.Count > 0)
            return Resultado<Formando>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Formando>.Ok(formando);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var formando = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (formando is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");

        // Os pagamentos dele são excluídos junto (cascata no banco) e o rateio é recalculado
        banco.Formandos.Remove(formando);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    private static void ValidarNome(string nome, Dictionary<string, string[]> erros)
    {
        if (nome.Length == 0)
            erros["nome"] = ["Informe o nome do formando."];
        else if (nome.Length > 120)
            erros["nome"] = ["O nome pode ter no máximo 120 caracteres."];
    }

    private Task<Formando?> BuscarDoUsuarioAsync(int usuarioId, int eventoId, int id) =>
        banco.Formandos.FirstOrDefaultAsync(f =>
            f.Id == id &&
            f.EventoId == eventoId &&
            banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId));

    private static Resultado<Formando> FormandoNaoEncontrado() =>
        Resultado<Formando>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");
}
