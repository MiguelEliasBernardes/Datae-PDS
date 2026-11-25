namespace Backend.Dtos;

// Organização de um evento que não é formatura: o dono e os co-organizadores que ele convidou.

public record CoOrganizadorResposta(int Id, string Nome, string Email, DateTime EntrouEm);

public record OrganizacaoResposta(
    string NomeDono,
    List<CoOrganizadorResposta> CoOrganizadores,
    int LimiteCoOrganizadores,
    // Código de convite (nulo = desligado); só o dono vê
    string? CodigoConvite,
    // Quem está vendo é o dono (convida, troca o código e remove pessoas)
    bool PodeGerenciar);
