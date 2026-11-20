using System.Net;
using System.Net.Mail;
using System.Text;

namespace Backend.Servicos;

/// <summary>
/// Envio de e-mail por SMTP (seção "Email" do appsettings). Funciona com qualquer provedor que aceite SMTP
/// (Gmail com senha de app, Resend, SendGrid, Brevo...).
/// Em desenvolvimento, "PastaSaida" grava cada e-mail como um arquivo .eml em vez de enviar,
/// para testar sem precisar de uma conta de e-mail.
/// </summary>
public class ServicoEmail(IConfiguration configuracao, IHostEnvironment ambiente)
{
    private readonly IConfigurationSection secao = configuracao.GetSection("Email");

    private string? Remetente => Validacoes.TextoOpcional(secao["Remetente"]);
    private string? Servidor => Validacoes.TextoOpcional(secao["Servidor"]);
    private string? PastaSaida => Validacoes.TextoOpcional(secao["PastaSaida"]);

    /// <summary>Sem remetente e sem servidor (ou pasta de saída), o envio de e-mail fica desativado.</summary>
    public bool Configurado => Remetente is not null && (Servidor is not null || PastaSaida is not null);

    public async Task EnviarAsync(string para, string? nomePara, string assunto, string corpo, CancellationToken cancelamento = default)
    {
        if (!Configurado)
            throw new InvalidOperationException("O envio de e-mail não está configurado.");

        using var mensagem = new MailMessage(
            new MailAddress(Remetente!, secao["NomeRemetente"] ?? "Dataê", Encoding.UTF8),
            new MailAddress(para, nomePara, Encoding.UTF8))
        {
            Subject = assunto,
            SubjectEncoding = Encoding.UTF8,
            Body = corpo,
            BodyEncoding = Encoding.UTF8,
        };

        using var cliente = new SmtpClient();
        if (PastaSaida is string pasta)
        {
            var caminho = Path.GetFullPath(pasta, ambiente.ContentRootPath);
            Directory.CreateDirectory(caminho);
            cliente.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory;
            cliente.PickupDirectoryLocation = caminho;
        }
        else
        {
            cliente.Host = Servidor!;
            cliente.Port = int.TryParse(secao["Porta"], out var porta) ? porta : 587;
            cliente.EnableSsl = !bool.TryParse(secao["UsarSsl"], out var ssl) || ssl;
            if (Validacoes.TextoOpcional(secao["Usuario"]) is string usuario)
                cliente.Credentials = new NetworkCredential(usuario, secao["Senha"]);
        }

        await cliente.SendMailAsync(mensagem, cancelamento);
    }
}
