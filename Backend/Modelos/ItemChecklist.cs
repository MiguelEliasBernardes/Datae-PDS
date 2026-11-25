namespace Backend.Modelos;

/// <summary>Tarefa da checklist de um evento, criada pelo organizador (à mão ou pelo Roteiro com IA).</summary>
public class ItemChecklist
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    public string Titulo { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public CategoriaChecklist Categoria { get; set; }

    // Prazo relativo: quantos dias antes do evento (0 = no dia; nulo = sem prazo).
    // Guardar assim faz o prazo acompanhar a data do evento se ela mudar
    public int? DiasAntes { get; set; }

    public bool Concluido { get; set; }
    public DateTime? ConcluidoEm { get; set; }

    public OrigemItemChecklist Origem { get; set; }

    // Formatura: integrante da comissão responsável pelo item (ele também pode marcar como feito)
    public int? ResponsavelFormandoId { get; set; }

    // Ordem de exibição dentro da categoria (a das sugestões segue a ordem dos modelos)
    public int Ordem { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
