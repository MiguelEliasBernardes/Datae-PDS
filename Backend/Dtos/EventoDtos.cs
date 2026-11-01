using Backend.Modelos;

namespace Backend.Dtos;

public record CriarEventoRequisicao(
    TipoEvento Tipo,
    DateTime DataEvento,
    string NomeEvento,
    string? Local,
    string? Descricao,
    string? CorPrincipal,
    string? CorSecundaria);

// Campos nulos não são alterados; texto vazio ("") limpa os campos opcionais
public record AtualizarEventoRequisicao(
    TipoEvento? Tipo,
    DateTime? DataEvento,
    string? NomeEvento,
    string? Local,
    string? SlugPublico,
    string? Descricao,
    string? CorPrincipal,
    string? CorSecundaria);

public record EventoResposta(
    int Id,
    int? PlanoAtualId,
    TipoEvento Tipo,
    DateTime DataEvento,
    string NomeEvento,
    string? Local,
    string SlugPublico,
    string? Descricao,
    string? CorPrincipal,
    string? CorSecundaria,
    DateTime CriadoEm);
