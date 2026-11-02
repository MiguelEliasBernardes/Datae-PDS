using Google.Apis.Auth;

namespace Backend.Servicos;

/// <summary>Dados da conta Google extraídos de uma credencial já validada.</summary>
public record ContaGoogle(string GoogleId, string Email, string? Nome, bool EmailVerificado);

/// <summary>
/// Valida a credencial (ID token) gerada pelo botão do Google no frontend:
/// confere a assinatura do Google, a validade e se o token foi emitido para o nosso Client ID.
/// </summary>
public class ServicoGoogle(IConfiguration configuracao, ILogger<ServicoGoogle> logger)
{
    public string? ClientId => configuracao["Google:ClientId"] is { Length: > 0 } id ? id : null;

    public async Task<ContaGoogle?> ValidarCredencialAsync(string credencial)
    {
        if (ClientId is null || string.IsNullOrWhiteSpace(credencial))
            return null;

        try
        {
            var dados = await GoogleJsonWebSignature.ValidateAsync(credencial, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [ClientId],
            });

            return new ContaGoogle(dados.Subject, dados.Email, dados.Name, dados.EmailVerified);
        }
        catch (InvalidJwtException erro)
        {
            logger.LogWarning("Credencial do Google recusada: {Motivo}", erro.Message);
            return null;
        }
    }
}
