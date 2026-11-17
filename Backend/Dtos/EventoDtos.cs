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
    string? CorSecundaria,
    string? ChavePix,
    string? NomeRecebedorPix,
    string? CidadePix,
    bool? ListaPresentesAtiva,
    bool? MuralAtivo);

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
    string? ChavePix,
    string? NomeRecebedorPix,
    string? CidadePix,
    bool ListaPresentesAtiva,
    bool MuralAtivo,
    string? BannerUrl,
    DateTime CriadoEm,
    // Quem está vendo: o dono do evento e/ou o papel dele na comissão, e o que ele pode fazer
    bool Organizador,
    PapelFormando? MeuPapel,
    List<Permissao> Permissoes,
    // Código de convite da turma; só aparece para quem gerencia a comissão
    string? CodigoTurma);
