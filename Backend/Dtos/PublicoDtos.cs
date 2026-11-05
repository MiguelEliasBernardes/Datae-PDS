using Backend.Modelos;

namespace Backend.Dtos;

// DTOs da página pública do evento (acessada pelos convidados, sem login).
// Nunca expõem dados internos como e-mail de convidado, código de reserva ou dono do evento.

public record EventoPublicoResposta(
    TipoEvento Tipo,
    DateTime DataEvento,
    string NomeEvento,
    string? Local,
    string SlugPublico,
    string? Descricao,
    string? CorPrincipal,
    string? CorSecundaria,
    bool PixDisponivel,
    string? NomeRecebedorPix);

public record PresentePublicoResposta(
    int Id,
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente Status,
    string? LinkAfiliado,
    string? Foto);

// RSVP: o convidado é localizado pelo nome; se ainda não estiver na lista, é adicionado
public record ConfirmarPresencaRequisicao(
    string Nome,
    bool VaiComparecer,
    int? QuantidadeAcompanhantes,
    string? Observacao);

public record PresencaResposta(
    string Nome,
    StatusPresenca StatusPresenca,
    int QuantidadeAcompanhantes,
    string? Observacao);

// JaComprado = true reserva e já marca como comprado de uma vez
public record ReservarPresenteRequisicao(string Nome, bool? JaComprado);

public record ReservaResposta(PresentePublicoResposta Presente, string CodigoReserva);

// Ações que só quem reservou pode fazer (identificado pelo código recebido na reserva)
public record AcaoReservaRequisicao(string CodigoReserva);

public record GerarPixRequisicao(decimal? Valor);

public record PixResposta(string CopiaECola, string QrCode, decimal? Valor, string NomeRecebedor);

public record FotoPublicaResposta(int Id, string? NomeAutor, string Url, DateTime EnviadaEm);
