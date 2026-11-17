using System.Security.Cryptography;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Convites para a comissão de formatura. Há dois tipos de código:
/// - o do formando (individual): liga a conta de quem aceitar àquele formando já cadastrado e deixa de valer;
/// - o da turma (geral, liga/desliga): quem aceitar vira um formando novo, com papel Membro.
/// O link do convite é /convite/{codigo}; para aceitar é preciso estar logado.
/// </summary>
public class ServicoConvite(ContextoBanco banco)
{
    // Sem 0/O e 1/I/L, que se confundem quando o código é ditado ou digitado
    private const string Alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int TamanhoCodigo = 8;

    /// <summary>Código aleatório que ainda não é usado por nenhum formando nem turma.</summary>
    public static async Task<string> GerarCodigoUnicoAsync(ContextoBanco banco)
    {
        while (true)
        {
            var codigo = new string(RandomNumberGenerator.GetItems<char>(Alfabeto, TamanhoCodigo));
            var emUso = await banco.Formandos.AnyAsync(f => f.CodigoConvite == codigo)
                || await banco.Eventos.AnyAsync(e => e.CodigoTurma == codigo);
            if (!emUso)
                return codigo;
        }
    }

    /// <summary>Dados do convite para mostrar antes de aceitar (não exige login).</summary>
    public async Task<Resultado<ConviteResposta>> ObterAsync(string codigo)
    {
        var codigoNormalizado = Normalizar(codigo);

        var formando = await banco.Formandos.FirstOrDefaultAsync(f => f.CodigoConvite == codigoNormalizado);
        if (formando is not null)
        {
            var eventoDoFormando = await banco.Eventos.FirstAsync(e => e.Id == formando.EventoId);
            return Resultado<ConviteResposta>.Ok(new ConviteResposta(
                TipoConvite.Formando, eventoDoFormando.NomeEvento, eventoDoFormando.DataEvento, formando.Nome));
        }

        var evento = await BuscarTurmaAsync(codigoNormalizado);
        return evento is null
            ? ConviteInvalido<ConviteResposta>()
            : Resultado<ConviteResposta>.Ok(new ConviteResposta(TipoConvite.Turma, evento.NomeEvento, evento.DataEvento, null));
    }

    /// <summary>Entra na formatura com o código. Devolve o acesso já com o papel de formando.</summary>
    public async Task<Resultado<AcessoEvento>> AceitarAsync(int usuarioId, string codigo)
    {
        var usuario = await banco.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null)
            return Resultado<AcessoEvento>.Falha(TipoErro.NaoAutorizado, "Sua sessão expirou. Entre novamente.");

        var codigoNormalizado = Normalizar(codigo);
        var formando = await banco.Formandos.FirstOrDefaultAsync(f => f.CodigoConvite == codigoNormalizado);
        var eventoId = formando?.EventoId ?? (await BuscarTurmaAsync(codigoNormalizado))?.Id;
        if (eventoId is null)
            return ConviteInvalido<AcessoEvento>();

        var jaParticipa = await banco.Formandos
            .Where(f => f.EventoId == eventoId && f.UsuarioId == usuarioId)
            .Select(f => f.Nome)
            .FirstOrDefaultAsync();
        if (jaParticipa is not null)
            return Resultado<AcessoEvento>.Falha(
                TipoErro.Conflito, $"Você já participa desta formatura como {jaParticipa}.");

        if (formando is not null)
        {
            // O código individual só serve uma vez
            formando.UsuarioId = usuarioId;
            formando.CodigoConvite = null;
        }
        else
        {
            banco.Formandos.Add(new Formando
            {
                EventoId = eventoId.Value,
                UsuarioId = usuarioId,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Slug = await ServicoFormando.GerarSlugUnicoAsync(banco, eventoId.Value, usuario.Nome),
            });
        }

        try
        {
            await banco.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Dois aceites ao mesmo tempo (o índice único de conta por evento barra o segundo)
            return Resultado<AcessoEvento>.Falha(TipoErro.Conflito, "Este convite acabou de ser usado. Atualize a página.");
        }

        var acesso = await ControleAcesso.ObterAsync(banco, usuarioId, eventoId.Value);
        return Resultado<AcessoEvento>.Ok(acesso!);
    }

    /// <summary>Liga (ou troca) o código geral da turma. O código anterior deixa de valer.</summary>
    public async Task<Resultado<AcessoEvento>> GerarCodigoTurmaAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarComissao, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso;

        acesso.Valor!.Evento.CodigoTurma = await GerarCodigoUnicoAsync(banco);
        await banco.SaveChangesAsync();
        return acesso;
    }

    /// <summary>Desliga o código geral da turma; os convites individuais continuam valendo.</summary>
    public async Task<Resultado<AcessoEvento>> DesativarCodigoTurmaAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarComissao, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso;

        acesso.Valor!.Evento.CodigoTurma = null;
        await banco.SaveChangesAsync();
        return acesso;
    }

    private Task<Evento?> BuscarTurmaAsync(string codigo) =>
        banco.Eventos.FirstOrDefaultAsync(e => e.CodigoTurma == codigo && e.Tipo == TipoEvento.Formatura);

    // Aceita o código com letras minúsculas, espaços ou hífens (ex.: "abcd-1234")
    private static string Normalizar(string? codigo) =>
        new((codigo ?? string.Empty).Where(char.IsAsciiLetterOrDigit).Select(char.ToUpperInvariant).ToArray());

    private static Resultado<T> ConviteInvalido<T>() =>
        Resultado<T>.Falha(TipoErro.NaoEncontrado, "Convite não encontrado. Ele pode já ter sido usado ou desativado.");
}
