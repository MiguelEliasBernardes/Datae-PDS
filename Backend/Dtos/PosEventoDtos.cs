using Backend.Modelos;

namespace Backend.Dtos;

// Pós-evento: resumo do que foi arrecadado para quem gerencia o evento e o envio dos agradecimentos.
// Os valores são estimados: com o Pix estático, o organizador confere os depósitos no extrato do banco.

/// <summary>Presente inteiro reservado ou comprado por um convidado.</summary>
public record PresenteRecebidoResposta(
    int Id,
    string Nome,
    decimal? Valor,
    StatusPresente Status,
    string? NomeConvidado,
    // Lista pessoal de um formando (nulo = lista do evento)
    string? NomeFormando);

/// <summary>Pix livre ("presente em dinheiro") avisado por um convidado.</summary>
public record PixResumoResposta(string NomeConvidado, decimal Valor, bool Conferido, DateTime InformadoEm);

public record CompraCotaResumoResposta(string NomeConvidado, int Quantidade, decimal Valor, DateTime CompradaEm);

/// <summary>Presente dividido em cotas que vendeu pelo menos uma cota.</summary>
public record PresenteCotasResumoResposta(
    int Id,
    string Nome,
    decimal? ValorEstimado,
    int QuantidadeCotas,
    int CotasVendidas,
    decimal ValorArrecadado,
    string? NomeFormando,
    List<CompraCotaResumoResposta> Compras);

/// <summary>
/// Convidado a quem agradecer (confirmou presença ou deu presente), com a mensagem já personalizada.
/// LinkWhatsApp é nulo sem telefone; o e-mail só pode ser enviado se ele tiver e-mail.
/// </summary>
public record AgradecimentoResposta(
    int ConvidadoId,
    string Nome,
    string? Telefone,
    string? Email,
    List<string> Motivos,
    string Mensagem,
    string? LinkWhatsApp,
    DateTime? EmailEnviadoEm,
    DateTime? WhatsAppAbertoEm);

public record ResumoPosEventoResposta(
    string NomeEvento,
    DateTime DataEvento,
    bool EventoRealizado,
    // Arrecadação estimada: presentes inteiros reservados/comprados (com valor) + cotas vendidas + Pix livres avisados
    decimal TotalArrecadado,
    decimal ValorPresentes,
    decimal ValorCotas,
    decimal ValorPix,
    int PresentesComprados,
    int PresentesReservados,
    int CotasVendidas,
    int Presenteadores,
    // Presença
    int Confirmados,
    int Acompanhantes,
    int Recusados,
    int Pendentes,
    int FotosAprovadas,
    List<PresenteRecebidoResposta> Presentes,
    List<PresenteCotasResumoResposta> PresentesComCotas,
    List<PixResumoResposta> Pix,
    List<AgradecimentoResposta> Agradecimentos,
    // Mensagem: a do organizador (nula = usa a padrão)
    string? MensagemAgradecimento,
    string MensagemPadrao,
    string LinkRecapitulacao,
    // Falso quando o servidor não tem e-mail configurado (os botões de e-mail ficam desativados)
    bool EmailDisponivel,
    DateTime? ResumoEnviadoEm);

// ConvidadoIds vazio = todos os que têm e-mail e ainda não receberam; Reenviar = manda de novo para quem já recebeu
public record EnviarAgradecimentosRequisicao(List<int>? ConvidadoIds, bool? Reenviar);

public record EnvioAgradecimentosResposta(int Enviados, int Falhas, ResumoPosEventoResposta Resumo);

public record EnvioResumoResposta(string Email);
