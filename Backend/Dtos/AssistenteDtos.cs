namespace Backend.Dtos;

/// <summary>Estilos de presente que o organizador pode pedir ao assistente.</summary>
public enum EstiloPresente
{
    Cozinha,
    Casa,
    Decoracao,
    Tecnologia,
    Experiencias,
    Pessoal,
    Lazer,
}

/// <summary>Quem vai ao evento (ajusta o tom do roteiro e das brincadeiras).</summary>
public enum PublicoEvento
{
    Adultos,
    Familia,
    Jovens,
    Criancas,
}

// Sugestões disponíveis para a lista: a do evento ou, com MinhaLista, a lista pessoal do formando
public record StatusAssistenteResposta(bool Disponivel, int GeracoesRestantes, int LimiteGeracoes);

// Quantidade nula = 10; valores nulos = sem limite naquele lado da faixa
public record SugerirPresentesRequisicao(
    bool? MinhaLista,
    decimal? ValorMinimo,
    decimal? ValorMaximo,
    List<EstiloPresente>? Estilos,
    int? Quantidade,
    string? Observacoes);

// QuantidadeCotas nula = presente inteiro
public record PresenteSugeridoResposta(string Nome, string? Descricao, decimal? ValorEstimado, int? QuantidadeCotas);

public record SugestoesPresentesResposta(List<PresenteSugeridoResposta> Presentes, int GeracoesRestantes);

// HorarioInicio no formato HH:mm; DuracaoHoras nula = 4
public record SugerirRoteiroRequisicao(
    string? HorarioInicio,
    int? DuracaoHoras,
    PublicoEvento? Publico,
    string? Observacoes);

public record MomentoRoteiroResposta(string Horario, string Titulo, string? Descricao);

public record BrincadeiraSugeridaResposta(string Titulo, string? Descricao, string? Materiais);

public record RoteiroResposta(
    List<MomentoRoteiroResposta> Momentos,
    List<BrincadeiraSugeridaResposta> Brincadeiras,
    int GeracoesRestantes);
