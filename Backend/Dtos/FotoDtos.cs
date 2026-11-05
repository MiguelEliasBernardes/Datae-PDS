using Backend.Modelos;

namespace Backend.Dtos;

// Moderação do mural pelo organizador: Aprovada aparece no mural, Recusada fica escondida
public record ModerarFotoRequisicao(StatusFoto Status);

public record FotoResposta(
    int Id,
    int EventoId,
    string? NomeAutor,
    string Url,
    StatusFoto Status,
    DateTime EnviadaEm);
