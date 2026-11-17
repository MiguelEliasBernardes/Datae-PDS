using Backend.Dados;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Quem é o usuário dentro de um evento: o organizador (dono do evento) e/ou o formando
/// ligado à conta dele por convite. Nos eventos que não são formatura, só o organizador participa.
/// </summary>
public record AcessoEvento(Evento Evento, Formando? Formando, bool Organizador)
{
    /// <summary>Papel na comissão; nulo para o organizador que não é formando.</summary>
    public PapelFormando? Papel => Formando?.Papel;

    public bool Pode(Permissao permissao) =>
        Organizador || permissao == Permissao.VerEvento || (Papel switch
        {
            PapelFormando.Administrador => true,
            PapelFormando.Financeiro => permissao == Permissao.Financeiro,
            PapelFormando.Fotos => permissao == Permissao.ModerarMural,
            _ => false,
        });

    public List<Permissao> Permissoes => Enum.GetValues<Permissao>().Where(Pode).ToList();
}

/// <summary>
/// Controle de acesso por papéis (RBAC): todo serviço que mexe num evento passa por aqui.
/// Quem não participa do evento recebe "não encontrado" (404), como se o evento não existisse;
/// quem participa mas não tem a permissão recebe "sem permissão" (403).
/// </summary>
public static class ControleAcesso
{
    public const string MensagemEventoNaoEncontrado = "Evento não encontrado.";

    /// <summary>O acesso do usuário ao evento, ou nulo se ele não participa.</summary>
    public static async Task<AcessoEvento?> ObterAsync(ContextoBanco banco, int usuarioId, int eventoId)
    {
        var evento = await banco.Eventos.FirstOrDefaultAsync(e => e.Id == eventoId);
        if (evento is null)
            return null;

        // Só a formatura tem comissão; o organizador também pode ser um dos formandos (se aceitou um convite)
        var formando = evento.Tipo == TipoEvento.Formatura
            ? await banco.Formandos.FirstOrDefaultAsync(f => f.EventoId == eventoId && f.UsuarioId == usuarioId)
            : null;

        var organizador = evento.UsuarioId == usuarioId;
        return organizador || formando is not null ? new AcessoEvento(evento, formando, organizador) : null;
    }

    /// <summary>
    /// Confere se o usuário participa do evento e tem a permissão. Com <paramref name="somenteFormatura"/>,
    /// eventos de outro tipo respondem 409 (formandos, despesas e rateio só existem na formatura).
    /// </summary>
    public static async Task<Resultado<AcessoEvento>> ExigirAsync(
        ContextoBanco banco, int usuarioId, int eventoId, Permissao permissao, bool somenteFormatura = false)
    {
        var acesso = await ObterAsync(banco, usuarioId, eventoId);
        if (acesso is null)
            return Resultado<AcessoEvento>.Falha(TipoErro.NaoEncontrado, MensagemEventoNaoEncontrado);

        if (somenteFormatura && acesso.Evento.Tipo != TipoEvento.Formatura)
            return Resultado<AcessoEvento>.Falha(
                TipoErro.Conflito, "Formandos, despesas e rateio só existem em eventos de formatura.");

        if (!acesso.Pode(permissao))
            return Resultado<AcessoEvento>.Falha(TipoErro.SemPermissao, MensagemSemPermissao(permissao));

        return Resultado<AcessoEvento>.Ok(acesso);
    }

    private static string MensagemSemPermissao(Permissao permissao) => permissao switch
    {
        Permissao.GerenciarEvento => "Só o organizador e os administradores da comissão podem alterar o evento.",
        Permissao.GerenciarComissao => "Só o organizador e os administradores da comissão podem gerenciar os formandos.",
        Permissao.Financeiro => "Só o organizador e a equipe do financeiro podem fazer isso.",
        Permissao.ModerarMural => "Só o organizador e a equipe de fotos podem moderar o mural.",
        _ => "Você não tem permissão para isso.",
    };
}
