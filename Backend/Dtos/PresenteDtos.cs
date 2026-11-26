using Backend.Modelos;

namespace Backend.Dtos;

// QuantidadeCotas divide o presente em cotas (de 2 a 100); nulo ou 0 = presente inteiro.
// A foto é enviada à parte, como arquivo (PUT .../presentes/{id}/foto).
public record CriarPresenteRequisicao(
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    string? LinkAfiliado,
    int? QuantidadeCotas);

// Campos nulos não são alterados; texto vazio ("") limpa os campos opcionais.
// Informar ConvidadoId reserva o presente; mudar o Status para Disponivel libera;
// Comprado marca o presente como já comprado (mantendo o convidado, se houver).
// QuantidadeCotas = 0 volta a ser um presente inteiro (só se nenhuma cota foi vendida).
public record AtualizarPresenteRequisicao(
    string? Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente? Status,
    int? ConvidadoId,
    string? LinkAfiliado,
    int? QuantidadeCotas);

// FotoUrl: caminho da foto na API (nulo = sem foto; o frontend mostra a cor do evento)
public record PresenteResposta(
    int Id,
    int EventoId,
    int? ConvidadoId,
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente Status,
    string? LinkAfiliado,
    string? FotoUrl,
    int? QuantidadeCotas,
    int CotasVendidas,
    decimal? ValorCota);

public record CotaPresenteResposta(
    int Id,
    int ItemPresenteId,
    int? ConvidadoId,
    string NomeConvidado,
    int Quantidade,
    decimal Valor,
    DateTime CriadoEm);
