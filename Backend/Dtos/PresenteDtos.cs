using Backend.Modelos;

namespace Backend.Dtos;

public record CriarPresenteRequisicao(
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    string? LinkAfiliado,
    string? Foto);

// Campos nulos não são alterados; texto vazio ("") limpa os campos opcionais.
// Informar ConvidadoId reserva o presente; mudar o Status para Disponivel libera.
public record AtualizarPresenteRequisicao(
    string? Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente? Status,
    int? ConvidadoId,
    string? LinkAfiliado,
    string? Foto);

public record PresenteResposta(
    int Id,
    int EventoId,
    int? ConvidadoId,
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente Status,
    string? LinkAfiliado,
    string? Foto);
