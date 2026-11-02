using Backend.Modelos;

namespace Backend.Dtos;

public record CriarConvidadoRequisicao(
    string Nome,
    string? Email,
    StatusPresenca? StatusPresenca,
    int? QuantidadeAcompanhantes,
    string? Observacao);

// Campos nulos não são alterados; texto vazio ("") limpa os campos opcionais
public record AtualizarConvidadoRequisicao(
    string? Nome,
    string? Email,
    StatusPresenca? StatusPresenca,
    int? QuantidadeAcompanhantes,
    string? Observacao);

public record ConvidadoResposta(
    int Id,
    int EventoId,
    string Nome,
    string? Email,
    StatusPresenca StatusPresenca,
    int QuantidadeAcompanhantes,
    string? Observacao);
