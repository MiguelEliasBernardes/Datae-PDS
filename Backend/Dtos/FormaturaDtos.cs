using Backend.Modelos;

namespace Backend.Dtos;

// DTOs dos módulos exclusivos de formatura: formandos, despesas e rateio.

public record CriarFormandoRequisicao(string Nome, string? Email, PapelFormando? Papel);

// Campos nulos não são alterados; texto vazio ("") limpa os campos opcionais
public record AtualizarFormandoRequisicao(string? Nome, string? Email, PapelFormando? Papel);

public record FormandoResposta(int Id, int EventoId, string Nome, string? Email, PapelFormando Papel, DateTime CriadoEm);

public record CriarDespesaRequisicao(string Descricao, decimal Valor, DateTime? Data);

// Campos nulos não são alterados
public record AtualizarDespesaRequisicao(string? Descricao, decimal? Valor, DateTime? Data);

public record DespesaResposta(int Id, int EventoId, string Descricao, decimal Valor, DateTime? Data, DateTime CriadoEm);

// PagoEm nulo = agora
public record RegistrarPagamentoRequisicao(decimal Valor, DateTime? PagoEm, string? Observacao);

public record PagamentoResposta(int Id, int FormandoId, decimal Valor, DateTime PagoEm, string? Observacao);

/// <summary>Situação de um formando no rateio.</summary>
public record RateioFormandoResposta(
    int FormandoId,
    string Nome,
    PapelFormando Papel,
    decimal ValorPago,
    decimal ValorDevido,
    int Percentual,
    bool Quitado);

/// <summary>Total das despesas dividido igualmente entre os formandos.</summary>
public record RateioResposta(
    decimal TotalDespesas,
    int QuantidadeFormandos,
    decimal ValorPorFormando,
    decimal TotalPago,
    int PercentualPago,
    List<RateioFormandoResposta> Formandos);
