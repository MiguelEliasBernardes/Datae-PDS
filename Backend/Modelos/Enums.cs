namespace Backend.Modelos;

public enum TipoEvento
{
    ChaDePanela,
    Casamento,
    Aniversario,
    Formatura,
}

public enum StatusPresenca
{
    Pendente,
    Confirmado,
    Recusado,
}

public enum StatusPresente
{
    Disponivel,
    Reservado,
    Comprado,
}

public enum StatusFoto
{
    Pendente,
    Aprovada,
    Recusada,
}

// Papéis da comissão de formatura (RBAC): cada papel libera um conjunto de permissões (ver ControleAcesso)
public enum PapelFormando
{
    Membro,
    Administrador,
    Financeiro,
    Fotos,
}

/// <summary>O que um participante pode fazer num evento.</summary>
public enum Permissao
{
    // Ver o evento e os módulos em modo leitura (todo participante tem)
    VerEvento,
    // Configurações da página, banner, convidados e lista de presentes do evento
    GerenciarEvento,
    // Formandos, papéis e convites
    GerenciarComissao,
    // Despesas, pagamentos e o rateio de todos os formandos
    Financeiro,
    // Moderação do mural de fotos
    ModerarMural,
}

public enum CategoriaChecklist
{
    Preparativos,
    Cerimonia,
    Decoracao,
    Brincadeiras,
    // Itens que podem virar presentes da lista (ex.: utensílios no chá de panela)
    Itens,
}

public enum OrigemItemChecklist
{
    // Copiado dos modelos de sugestões do tipo do evento
    Sugestao,
    // Criado pelo organizador
    Manual,
}
