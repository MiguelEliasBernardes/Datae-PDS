namespace Backend.Dtos;

public record CadastroRequisicao(string Nome, string Email, string Senha);

public record   LoginRequisicao(string Email, string Senha);

// Credencial (ID token) devolvida pelo botão "Entrar com Google" no frontend
public record LoginGoogleRequisicao(string Credencial);

public record AtualizarUsuarioRequisicao(string? Nome, string? Email, string? SenhaAtual, string? NovaSenha);

public record UsuarioResposta(int Id, string Nome, string Email, DateTime CriadoEm);

public record LoginResposta(string Token, DateTime ExpiraEm, UsuarioResposta Usuario);
