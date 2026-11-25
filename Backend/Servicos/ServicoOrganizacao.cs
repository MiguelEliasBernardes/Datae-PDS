using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Organização de um evento que não é formatura (na formatura, a equipe é a comissão de formandos).
/// O dono liga um código de convite (/convite/{codigo}); quem aceita vira co-organizador e pode tudo
/// no evento, menos excluí-lo e mexer na organização. Só o dono troca ou desliga o código e remove pessoas;
/// o co-organizador pode sair por conta própria. Toda alteração devolve a organização inteira.
/// </summary>
public class ServicoOrganizacao(ContextoBanco banco)
{
    public const int LimiteCoOrganizadores = 5;

    public async Task<Resultado<OrganizacaoResposta>> ObterAsync(int usuarioId, int eventoId)
    {
        var acesso = await ExigirEventoComOrganizacaoAsync(usuarioId, eventoId);
        return acesso.Sucesso ? Resultado<OrganizacaoResposta>.Ok(await MontarAsync(acesso.Valor!)) : acesso.Repassar<OrganizacaoResposta>();
    }

    /// <summary>Liga (ou troca) o código de convite. O código anterior deixa de valer.</summary>
    public async Task<Resultado<OrganizacaoResposta>> GerarCodigoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ExigirDonoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<OrganizacaoResposta>();

        acesso.Valor!.Evento.CodigoOrganizacao = await ServicoConvite.GerarCodigoUnicoAsync(banco);
        await banco.SaveChangesAsync();
        return Resultado<OrganizacaoResposta>.Ok(await MontarAsync(acesso.Valor));
    }

    /// <summary>Desliga o código: ninguém mais entra por ele (quem já entrou continua).</summary>
    public async Task<Resultado<OrganizacaoResposta>> DesativarCodigoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ExigirDonoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<OrganizacaoResposta>();

        acesso.Valor!.Evento.CodigoOrganizacao = null;
        await banco.SaveChangesAsync();
        return Resultado<OrganizacaoResposta>.Ok(await MontarAsync(acesso.Valor));
    }

    public async Task<Resultado<OrganizacaoResposta>> RemoverAsync(int usuarioId, int eventoId, int coOrganizadorId)
    {
        var acesso = await ExigirDonoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<OrganizacaoResposta>();

        var removidos = await banco.CoOrganizadores
            .Where(c => c.Id == coOrganizadorId && c.EventoId == eventoId)
            .ExecuteDeleteAsync();
        if (removidos == 0)
            return Resultado<OrganizacaoResposta>.Falha(TipoErro.NaoEncontrado, "Esta pessoa não está na organização.");

        return Resultado<OrganizacaoResposta>.Ok(await MontarAsync(acesso.Valor!));
    }

    /// <summary>O co-organizador sai da organização (o evento some de "Meus Eventos" dele).</summary>
    public async Task<Resultado<bool>> SairAsync(int usuarioId, int eventoId)
    {
        var acesso = await ExigirEventoComOrganizacaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<bool>();
        if (!acesso.Valor!.CoOrganizador)
            return Resultado<bool>.Falha(
                TipoErro.Conflito, "Quem criou o evento não pode sair da organização. Para encerrar, exclua o evento.");

        await banco.CoOrganizadores.Where(c => c.EventoId == eventoId && c.UsuarioId == usuarioId).ExecuteDeleteAsync();
        return Resultado<bool>.Ok(true);
    }

    private async Task<Resultado<AcessoEvento>> ExigirEventoComOrganizacaoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento);
        if (!acesso.Sucesso)
            return acesso;
        if (acesso.Valor!.Evento.Tipo == TipoEvento.Formatura)
            return Resultado<AcessoEvento>.Falha(
                TipoErro.Conflito, "Na formatura, quem ajuda a organizar é a comissão de formandos.");
        return acesso;
    }

    private async Task<Resultado<AcessoEvento>> ExigirDonoAsync(int usuarioId, int eventoId)
    {
        var acesso = await ExigirEventoComOrganizacaoAsync(usuarioId, eventoId);
        if (acesso.Sucesso && !acesso.Valor!.Organizador)
            return Resultado<AcessoEvento>.Falha(TipoErro.SemPermissao, "Só quem criou o evento pode convidar ou remover pessoas da organização.");
        return acesso;
    }

    private async Task<OrganizacaoResposta> MontarAsync(AcessoEvento acesso)
    {
        var evento = acesso.Evento;
        var coOrganizadores = await (
                from c in banco.CoOrganizadores
                join u in banco.Usuarios on c.UsuarioId equals u.Id
                where c.EventoId == evento.Id
                orderby c.EntrouEm
                select new CoOrganizadorResposta(c.Id, u.Nome, u.Email, c.EntrouEm))
            .ToListAsync();
        var nomeDono = await banco.Usuarios.Where(u => u.Id == evento.UsuarioId).Select(u => u.Nome).FirstAsync();

        return new OrganizacaoResposta(
            nomeDono,
            coOrganizadores,
            LimiteCoOrganizadores,
            acesso.Organizador ? evento.CodigoOrganizacao : null,
            acesso.Organizador);
    }
}
