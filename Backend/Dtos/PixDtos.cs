namespace Backend.Dtos;

// Avisos de Pix feitos pelos convidados ("Já fiz o Pix") e o relatório do organizador (Financeiro > Pix).
// O Pix é estático: o sistema não confirma o pagamento, então cada aviso precisa ser conferido no extrato.

/// <summary>Origem do Pix: o "presente em dinheiro" (valor livre) ou o pagamento de cotas de um presente.</summary>
public enum OrigemPix
{
    Livre,
    Cotas,
}

public record PixInformadoResposta(
    int Id,
    string NomeConvidado,
    decimal Valor,
    string? Recado,
    OrigemPix Origem,
    // Ex.: "2 cotas de Viagem" ou "Lista de Ana" (nulo = Pix livre na página do evento)
    string? Detalhe,
    bool Conferido,
    DateTime InformadoEm,
    DateTime? ConferidoEm);

public record RelatorioPixResposta(
    List<PixInformadoResposta> Itens,
    decimal TotalInformado,
    decimal TotalConferido,
    int AguardandoConferencia,
    // Falso: o evento ainda não tem chave Pix configurada (a página pública não mostra o Pix)
    bool PixConfigurado);

public record AtualizarPixInformadoRequisicao(bool Conferido);
