using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoUsuario(ContextoBanco banco, IPasswordHasher<Usuario> hasher)
{
    private const int TamanhoMinimoSenha = 6;

    public async Task<Resultado<Usuario>> CadastrarAsync(CadastroRequisicao requisicao)
    {
        var email = NormalizarEmail(requisicao.Email);
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.Nome))
            erros["nome"] = ["Informe o nome."];
        if (!EmailValido(email))
            erros["email"] = ["Informe um e-mail válido."];
        if (!SenhaValida(requisicao.Senha))
            erros["senha"] = [$"A senha deve ter pelo menos {TamanhoMinimoSenha} caracteres."];

        if (erros.Count > 0)
            return Resultado<Usuario>.Invalido(erros);

        if (await EmailEmUsoAsync(email))
            return Resultado<Usuario>.Falha(TipoErro.Conflito, "Já existe uma conta com este e-mail.");

        var usuario = new Usuario { Nome = requisicao.Nome.Trim(), Email = email };
        usuario.SenhaHash = hasher.HashPassword(usuario, requisicao.Senha);

        banco.Usuarios.Add(usuario);
        await banco.SaveChangesAsync();

        return Resultado<Usuario>.Ok(usuario);
    }

    public async Task<Resultado<Usuario>> AutenticarAsync(LoginRequisicao requisicao)
    {
        if (string.IsNullOrWhiteSpace(requisicao.Email) || string.IsNullOrWhiteSpace(requisicao.Senha))
            return Resultado<Usuario>.Invalido(new() { ["login"] = ["Informe e-mail e senha."] });

        var email = NormalizarEmail(requisicao.Email);
        var usuario = await banco.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta
        if (usuario is null)
            return CredenciaisInvalidas();

        var verificacao = hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, requisicao.Senha);
        if (verificacao == PasswordVerificationResult.Failed)
            return CredenciaisInvalidas();

        if (verificacao == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.SenhaHash = hasher.HashPassword(usuario, requisicao.Senha);
            await banco.SaveChangesAsync();
        }

        return Resultado<Usuario>.Ok(usuario);
    }

    public async Task<Resultado<Usuario>> ObterPorIdAsync(int id)
    {
        var usuario = await banco.Usuarios.FindAsync(id);
        return usuario is null ? UsuarioNaoEncontrado() : Resultado<Usuario>.Ok(usuario);
    }

    public async Task<Resultado<Usuario>> AtualizarAsync(int id, AtualizarUsuarioRequisicao requisicao)
    {
        var usuario = await banco.Usuarios.FindAsync(id);
        if (usuario is null)
            return UsuarioNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Nome is not null)
        {
            if (string.IsNullOrWhiteSpace(requisicao.Nome))
                erros["nome"] = ["O nome não pode ficar vazio."];
            else
                usuario.Nome = requisicao.Nome.Trim();
        }

        if (requisicao.Email is not null)
        {
            var email = NormalizarEmail(requisicao.Email);
            if (!EmailValido(email))
                erros["email"] = ["Informe um e-mail válido."];
            else if (email != usuario.Email && await EmailEmUsoAsync(email))
                return Resultado<Usuario>.Falha(TipoErro.Conflito, "Já existe uma conta com este e-mail.");
            else
                usuario.Email = email;
        }

        if (requisicao.NovaSenha is not null)
        {
            var senhaAtualCorreta = requisicao.SenhaAtual is not null &&
                hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, requisicao.SenhaAtual) != PasswordVerificationResult.Failed;

            if (!senhaAtualCorreta)
                erros["senhaAtual"] = ["A senha atual está incorreta."];
            else if (!SenhaValida(requisicao.NovaSenha))
                erros["novaSenha"] = [$"A nova senha deve ter pelo menos {TamanhoMinimoSenha} caracteres."];
            else
                usuario.SenhaHash = hasher.HashPassword(usuario, requisicao.NovaSenha);
        }

        if (erros.Count > 0)
            return Resultado<Usuario>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Usuario>.Ok(usuario);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int id)
    {
        var usuario = await banco.Usuarios.FindAsync(id);
        if (usuario is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Usuário não encontrado.");

        banco.Usuarios.Remove(usuario);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    private Task<bool> EmailEmUsoAsync(string email) => banco.Usuarios.AnyAsync(u => u.Email == email);

    private static bool SenhaValida(string? senha) => senha is not null && senha.Length >= TamanhoMinimoSenha;

    private static Resultado<Usuario> CredenciaisInvalidas() =>
        Resultado<Usuario>.Falha(TipoErro.NaoAutorizado, "E-mail ou senha inválidos.");

    private static Resultado<Usuario> UsuarioNaoEncontrado() =>
        Resultado<Usuario>.Falha(TipoErro.NaoEncontrado, "Usuário não encontrado.");
}
