using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoUsuario(
    ContextoBanco banco,
    IPasswordHasher<Usuario> hasher,
    ServicoGoogle servicoGoogle,
    ArmazenamentoArquivos armazenamento)
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

        // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta.
        // Conta criada pelo Google sem senha definida também cai aqui.
        if (usuario?.SenhaHash is null)
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

    /// <summary>
    /// Entra com a conta Google. Se ainda não existir conta, cria uma (sem senha).
    /// Se já existir conta com o mesmo e-mail, vincula o Google a ela.
    /// </summary>
    public async Task<Resultado<Usuario>> AutenticarComGoogleAsync(LoginGoogleRequisicao requisicao)
    {
        if (servicoGoogle.ClientId is null)
            return Resultado<Usuario>.Falha(TipoErro.Indisponivel, "O login com Google não está configurado no servidor.");

        var conta = await servicoGoogle.ValidarCredencialAsync(requisicao.Credencial);
        if (conta is null)
            return Resultado<Usuario>.Falha(TipoErro.NaoAutorizado, "Não foi possível validar o login com Google. Tente novamente.");

        // Sem e-mail verificado, qualquer um poderia se passar pelo dono do e-mail
        if (!conta.EmailVerificado)
            return Resultado<Usuario>.Falha(TipoErro.NaoAutorizado, "O e-mail desta conta Google não está verificado.");

        var usuario = await banco.Usuarios.FirstOrDefaultAsync(u => u.GoogleId == conta.GoogleId);
        if (usuario is not null)
            return Resultado<Usuario>.Ok(usuario);

        var email = NormalizarEmail(conta.Email);
        usuario = await banco.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (usuario is not null)
        {
            // Conta já existia (cadastro com senha): passa a aceitar também o Google
            if (usuario.GoogleId is not null)
                return Resultado<Usuario>.Falha(TipoErro.Conflito, "Este e-mail já está vinculado a outra conta Google.");

            usuario.GoogleId = conta.GoogleId;
        }
        else
        {
            usuario = new Usuario
            {
                Nome = string.IsNullOrWhiteSpace(conta.Nome) ? email.Split('@')[0] : conta.Nome.Trim(),
                Email = email,
                GoogleId = conta.GoogleId,
            };
            banco.Usuarios.Add(usuario);
        }

        await banco.SaveChangesAsync();
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
            // Conta criada pelo Google ainda não tem senha: pode definir a primeira sem informar a atual
            var senhaAtualCorreta = usuario.SenhaHash is null || (requisicao.SenhaAtual is not null &&
                hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, requisicao.SenhaAtual) != PasswordVerificationResult.Failed);

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

        // Os eventos saem junto (cascata no banco); as fotos do mural deles ficam em disco e são apagadas à parte
        var idsEventos = await banco.Eventos.Where(e => e.UsuarioId == id).Select(e => e.Id).ToListAsync();

        banco.Usuarios.Remove(usuario);
        await banco.SaveChangesAsync();

        foreach (var eventoId in idsEventos)
            armazenamento.ExcluirPastaEvento(eventoId);

        return Resultado<bool>.Ok(true);
    }

    private Task<bool> EmailEmUsoAsync(string email) => banco.Usuarios.AnyAsync(u => u.Email == email);

    private static bool SenhaValida(string? senha) => senha is not null && senha.Length >= TamanhoMinimoSenha;

    private static Resultado<Usuario> CredenciaisInvalidas() =>
        Resultado<Usuario>.Falha(TipoErro.NaoAutorizado, "E-mail ou senha inválidos.");

    private static Resultado<Usuario> UsuarioNaoEncontrado() =>
        Resultado<Usuario>.Falha(TipoErro.NaoEncontrado, "Usuário não encontrado.");
}
