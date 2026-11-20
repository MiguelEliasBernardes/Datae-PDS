using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Integrantes da turma de uma formatura. Só funciona em eventos do tipo Formatura.
/// Cadastrar, mudar papéis e convidar exige gerenciar a comissão (organizador ou administrador);
/// cada formando que entrou por convite edita a própria sub-página ("eu").
/// </summary>
public class ServicoFormando(ContextoBanco banco)
{
    private const int TamanhoMaximoSlug = 120;

    public async Task<Resultado<List<Formando>>> ListarAsync(int usuarioId, int eventoId, PapelFormando? papel)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<List<Formando>>();

        var consulta = banco.Formandos.Where(f => f.EventoId == eventoId);
        if (papel is not null)
            consulta = consulta.Where(f => f.Papel == papel);

        return Resultado<List<Formando>>.Ok(await consulta.OrderBy(f => f.Nome).ToListAsync());
    }

    public async Task<Resultado<Formando>> CriarAsync(int usuarioId, int eventoId, CriarFormandoRequisicao requisicao)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Formando>();

        var nome = NormalizarNome(requisicao.Nome);
        var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
        var erros = new Dictionary<string, string[]>();

        ValidarNome(nome, erros);
        if (email is not null && !EmailValido(email))
            erros["email"] = ["Informe um e-mail válido."];
        if (requisicao.Papel is PapelFormando papel && !Enum.IsDefined(papel))
            erros["papel"] = ["Papel inválido."];

        if (erros.Count > 0)
            return Resultado<Formando>.Invalido(erros);

        // Todo formando já nasce com o convite individual pronto para ser enviado
        var formando = new Formando
        {
            EventoId = eventoId,
            Nome = nome,
            Email = email,
            Papel = requisicao.Papel ?? PapelFormando.Membro,
            Slug = await GerarSlugUnicoAsync(banco, eventoId, nome),
            CodigoConvite = await ServicoConvite.GerarCodigoUnicoAsync(banco),
        };

        banco.Formandos.Add(formando);
        await banco.SaveChangesAsync();

        return Resultado<Formando>.Ok(formando);
    }

    public async Task<Resultado<Formando>> AtualizarAsync(
        int usuarioId, int eventoId, int id, AtualizarFormandoRequisicao requisicao)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Formando>();

        var formando = await BuscarAsync(eventoId, id);
        if (formando is null)
            return FormandoNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        // O endereço da sub-página não muda com o nome, para os links já compartilhados continuarem valendo
        if (requisicao.Nome is not null)
        {
            var nome = NormalizarNome(requisicao.Nome);
            ValidarNome(nome, erros);
            if (!erros.ContainsKey("nome"))
                formando.Nome = nome;
        }

        if (requisicao.Email is not null)
        {
            var email = TextoOpcional(requisicao.Email) is null ? null : NormalizarEmail(requisicao.Email);
            if (email is not null && !EmailValido(email))
                erros["email"] = ["Informe um e-mail válido."];
            else
                formando.Email = email;
        }

        if (requisicao.Papel is PapelFormando papel)
        {
            if (!Enum.IsDefined(papel))
                erros["papel"] = ["Papel inválido."];
            else
                formando.Papel = papel;
        }

        if (erros.Count > 0)
            return Resultado<Formando>.Invalido(erros);

        await banco.SaveChangesAsync();
        return Resultado<Formando>.Ok(formando);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<bool>();

        var formando = await BuscarAsync(eventoId, id);
        if (formando is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");

        // Os pagamentos e a lista pessoal dele são excluídos junto (cascata no banco); a conta perde o acesso
        banco.Formandos.Remove(formando);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Gera um código de convite novo; o anterior deixa de valer (ex.: foi enviado para a pessoa errada).</summary>
    public async Task<Resultado<Formando>> GerarNovoConviteAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Formando>();

        var formando = await BuscarAsync(eventoId, id);
        if (formando is null)
            return FormandoNaoEncontrado();
        if (formando.UsuarioId is not null)
            return Resultado<Formando>.Falha(
                TipoErro.Conflito, "Este formando já entrou na turma. Desfaça o vínculo antes de gerar outro convite.");

        formando.CodigoConvite = await ServicoConvite.GerarCodigoUnicoAsync(banco);
        await banco.SaveChangesAsync();
        return Resultado<Formando>.Ok(formando);
    }

    /// <summary>
    /// Tira o acesso da conta ligada ao formando (ex.: a pessoa errada aceitou o convite).
    /// O formando continua na turma, com pagamentos e lista, e ganha um convite novo.
    /// </summary>
    public async Task<Resultado<Formando>> DesvincularAsync(int usuarioId, int eventoId, int id)
    {
        var acesso = await ExigirGestaoAsync(usuarioId, eventoId);
        if (!acesso.Sucesso)
            return acesso.Repassar<Formando>();

        var formando = await BuscarAsync(eventoId, id);
        if (formando is null)
            return FormandoNaoEncontrado();

        formando.UsuarioId = null;
        formando.CodigoConvite = await ServicoConvite.GerarCodigoUnicoAsync(banco);
        await banco.SaveChangesAsync();
        return Resultado<Formando>.Ok(formando);
    }

    // ===== O próprio formando =====

    /// <summary>O formando ligado à conta logada (para a tela "Minha página").</summary>
    public async Task<Resultado<Formando>> ObterMeuAsync(int usuarioId, int eventoId)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.VerEvento, somenteFormatura: true);
        if (!acesso.Sucesso)
            return acesso.Repassar<Formando>();

        return acesso.Valor!.Formando is { } formando ? Resultado<Formando>.Ok(formando) : NaoEhFormando();
    }

    /// <summary>O formando muda o recado da própria sub-página.</summary>
    public async Task<Resultado<Formando>> AtualizarMeuAsync(int usuarioId, int eventoId, AtualizarMeuFormandoRequisicao requisicao)
    {
        var meu = await ObterMeuAsync(usuarioId, eventoId);
        if (!meu.Sucesso)
            return meu;

        var formando = meu.Valor!;
        if (requisicao.Mensagem is not null)
        {
            var mensagem = TextoOpcional(requisicao.Mensagem);
            if (mensagem?.Length > 1000)
                return Resultado<Formando>.Invalido(new() { ["mensagem"] = ["O recado pode ter no máximo 1000 caracteres."] });
            formando.Mensagem = mensagem;
        }

        await banco.SaveChangesAsync();
        return Resultado<Formando>.Ok(formando);
    }

    /// <summary>Endereço da sub-página único dentro do evento, ex.: "ana-lima" ou "ana-lima-2".</summary>
    public static async Task<string> GerarSlugUnicoAsync(ContextoBanco banco, int eventoId, string nome)
    {
        var slugBase = GerarSlug(nome, "formando", TamanhoMaximoSlug);
        var slug = slugBase;
        var sufixo = 2;

        // "recapitulacao" é o endereço da página de recapitulação do evento (/e/{slug}/recapitulacao)
        if (slug == ServicoPosEvento.SlugRecapitulacao)
            slug = $"{slugBase}-{sufixo++}";

        while (await banco.Formandos.AnyAsync(f => f.EventoId == eventoId && f.Slug == slug))
            slug = $"{slugBase}-{sufixo++}";

        return slug;
    }

    private Task<Resultado<AcessoEvento>> ExigirGestaoAsync(int usuarioId, int eventoId) =>
        ControleAcesso.ExigirAsync(banco, usuarioId, eventoId, Permissao.GerenciarComissao, somenteFormatura: true);

    private static void ValidarNome(string nome, Dictionary<string, string[]> erros)
    {
        if (nome.Length == 0)
            erros["nome"] = ["Informe o nome do formando."];
        else if (nome.Length > 120)
            erros["nome"] = ["O nome pode ter no máximo 120 caracteres."];
    }

    // O acesso ao evento já foi conferido pelo ControleAcesso
    private Task<Formando?> BuscarAsync(int eventoId, int id) =>
        banco.Formandos.FirstOrDefaultAsync(f => f.Id == id && f.EventoId == eventoId);

    private static Resultado<Formando> FormandoNaoEncontrado() =>
        Resultado<Formando>.Falha(TipoErro.NaoEncontrado, "Formando não encontrado.");

    private static Resultado<Formando> NaoEhFormando() =>
        Resultado<Formando>.Falha(TipoErro.Conflito, "Você organiza esta formatura, mas não entrou nela como formando.");
}
