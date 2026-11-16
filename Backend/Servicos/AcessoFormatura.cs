using Backend.Dados;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>Conferência usada pelos módulos de formatura (formandos, despesas e rateio).</summary>
public static class AcessoFormatura
{
    /// <summary>
    /// Nulo se o evento é do usuário e é uma formatura; senão, o erro a devolver.
    /// Evento de outro usuário responde "não encontrado", como nos outros módulos.
    /// </summary>
    public static async Task<(TipoErro Erro, string Mensagem)?> ConferirAsync(ContextoBanco banco, int usuarioId, int eventoId)
    {
        var tipo = await banco.Eventos
            .Where(e => e.Id == eventoId && e.UsuarioId == usuarioId)
            .Select(e => (TipoEvento?)e.Tipo)
            .FirstOrDefaultAsync();

        if (tipo is null)
            return (TipoErro.NaoEncontrado, "Evento não encontrado.");
        if (tipo != TipoEvento.Formatura)
            return (TipoErro.Conflito, "Formandos, despesas e rateio só existem em eventos de formatura.");

        return null;
    }
}
