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
    string? NomeRecebedorPix,
    string? BannerUrl,
    bool ListaPresentesAtiva,
    bool MuralAtivo);

public record PresentePublicoResposta(
    int Id,
    string Nome,
    string? Descricao,
    decimal? ValorEstimado,
    StatusPresente Status,
    string? LinkAfiliado,
    string? Foto,
    int? QuantidadeCotas,
    int CotasVendidas,
    decimal? ValorCota);

// RSVP: o convidado é localizado pelo nome; se ainda não estiver na lista, é adicionado
public record ConfirmarPresencaRequisicao(
    string Nome,
    bool VaiComparecer,
    int? QuantidadeAcompanhantes,
    string? Observacao,
    // Contatos opcionais, para o organizador mandar o agradecimento depois do evento
    string? Telefone = null,
    string? Email = null);

public record PresencaResposta(
    string Nome,
    StatusPresenca StatusPresenca,
    int QuantidadeAcompanhantes,
    string? Observacao);

// JaComprado = true reserva e já marca como comprado de uma vez
public record ReservarPresenteRequisicao(string Nome, bool? JaComprado, string? Telefone = null, string? Email = null);

public record ReservaResposta(PresentePublicoResposta Presente, string CodigoReserva);

// Ações que só quem reservou pode fazer (identificado pelo código recebido na reserva)
public record AcaoReservaRequisicao(string CodigoReserva);

public record GerarPixRequisicao(decimal? Valor);

public record PixResposta(string CopiaECola, string QrCode, decimal? Valor, string NomeRecebedor);

// Compra de cotas de um presente; o convidado paga pelo Pix do evento
public record ComprarCotasRequisicao(string Nome, int Quantidade, string? Telefone = null, string? Email = null);

// Pix é nulo quando o evento não tem Pix configurado (o convidado combina o pagamento com o organizador)
// CotaId: usado no "Já fiz o Pix" das cotas (com o mesmo nome da compra)
public record CompraCotasResposta(PresentePublicoResposta Presente, int Quantidade, decimal? Valor, PixResposta? Pix, int CotaId);

// "Já fiz o Pix": o convidado avisa o organizador. Com CotaId, é o Pix de uma compra de cotas
// (o valor vem da compra e o nome precisa ser o mesmo usado nela); sem CotaId, é o Pix livre e Valor é obrigatório.
// SlugFormando: Pix livre feito pela sub-página de um formando.
public record InformarPixRequisicao(
    string? Nome,
    decimal? Valor,
    string? Recado,
    string? Telefone = null,
    string? Email = null,
    int? CotaId = null,
    string? SlugFormando = null);

public record InformarPixResposta(string Nome, decimal Valor);

// Formandos da turma na página pública da formatura (cada um tem a sua sub-página)
public record FormandoPublicoResposta(string Nome, string Slug);

public record PaginaFormandoResposta(string Nome, string Slug, string? Mensagem);

public record FotoPublicaResposta(int Id, string? NomeAutor, string Url, DateTime EnviadaEm);

// Página de recapitulação (/e/{slug}/recapitulacao), aberta depois do evento.
// Só números gerais: nada de valores nem de quem deu cada presente
public record RecapitulacaoResposta(
    EventoPublicoResposta Evento,
    string MensagemAgradecimento,
    int PessoasPresentes,
    int PresentesRecebidos,
    int Presenteadores,
    List<FotoPublicaResposta> Fotos);
