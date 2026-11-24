namespace Backend.Dtos;

public record CadastroRequisicao(string Nome, string Email, string Senha);

public record   LoginRequisicao(string Email, string Senha);

// Credencial (ID token) devolvida pelo botão "Entrar com Google" no frontend
public record LoginGoogleRequisicao(string Credencial);

public record AtualizarUsuarioRequisicao(string? Nome, string? Email, string? SenhaAtual, string? NovaSenha);

// TemSenha = false: conta criada pelo Google que ainda não definiu uma senha
public record UsuarioResposta(int Id, string Nome, string Email, DateTime CriadoEm, bool TemSenha);

public record LoginResposta(string Token, DateTime ExpiraEm, UsuarioResposta Usuario);
