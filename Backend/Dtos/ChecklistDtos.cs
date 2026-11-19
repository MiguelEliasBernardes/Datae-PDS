using Backend.Modelos;

namespace Backend.Dtos;

// Categoria nula = Preparativos; DiasAntes nulo = sem prazo
public record CriarItemChecklistRequisicao(
    string Titulo,
    string? Descricao,
    CategoriaChecklist? Categoria,
    int? DiasAntes,
    int? ResponsavelFormandoId);

// Campos nulos não são alterados; texto vazio ("") limpa a descrição.
// DiasAntes = -1 tira o prazo; ResponsavelFormandoId = 0 tira o responsável
public record AtualizarItemChecklistRequisicao(
    string? Titulo,
    string? Descricao,
    CategoriaChecklist? Categoria,
    int? DiasAntes,
    bool? Concluido,
    int? ResponsavelFormandoId);

// Chaves nulas ou vazias = todas as sugestões que ainda não estão na checklist
public record AdicionarSugestoesRequisicao(List<string>? Chaves);

public record ItemChecklistResposta(
    int Id,
    string Titulo,
    string? Descricao,
    CategoriaChecklist Categoria,
    int? DiasAntes,
    // Data limite calculada a partir da data do evento (nula = sem prazo)
    DateTime? Prazo,
    bool Concluido,
    DateTime? ConcluidoEm,
    OrigemItemChecklist Origem,
    int? ResponsavelFormandoId,
    string? ResponsavelNome,
    // O que quem está vendo pode fazer com o item
    bool PodeConcluir,
    bool PodeVirarPresente);

/// <summary>Tela que resolve a dica (o frontend abre a tela correspondente).</summary>
public enum AcaoDica
{
    Configuracoes,
    Presentes,
    MeusPresentes,
    Convidados,
    Mural,
    Formandos,
    Despesas,
    Rateio,
}

/// <summary>Dica calculada a partir do estado do evento; some (ou fica concluída) quando a situação se resolve.</summary>
public record DicaChecklistResposta(string Chave, string Titulo, string? Descricao, bool Concluida, AcaoDica Acao);

public record ChecklistResposta(List<ItemChecklistResposta> Itens, List<DicaChecklistResposta> Dicas, bool PodeGerenciar);

public record SugestaoChecklistResposta(
    string Chave,
    string Titulo,
    string? Descricao,
    CategoriaChecklist Categoria,
    int? DiasAntes,
    decimal? ValorSugerido);
