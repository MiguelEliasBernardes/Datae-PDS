using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoEvento(ContextoBanco banco, ArmazenamentoArquivos armazenamento)
{
    private const int TamanhoMaximoSlug = 150;
    public const long TamanhoMaximoBannerBytes = 10 * 1024 * 1024;

    /// <summary>Eventos que o usuário organiza e formaturas em que ele entrou como formando.</summary>
    public async Task<Resultado<List<AcessoEvento>>> ListarAsync(int usuarioId)
    {
        var formandos = await banco.Formandos.Where(f => f.UsuarioId == usuarioId).ToListAsync();
        var idsComoFormando = formandos.Select(f => f.EventoId).ToList();
        var idsComoCoOrganizador = await banco.CoOrganizadores
            .Where(c => c.UsuarioId == usuarioId)
            .Select(c => c.EventoId)
            .ToListAsync();

        var eventos = await banco.Eventos
            .Where(e => e.UsuarioId == usuarioId
                || (e.Tipo == TipoEvento.Formatura && idsComoFormando.Contains(e.Id))
                || (e.Tipo != TipoEvento.Formatura && idsComoCoOrganizador.Contains(e.Id)))
            .OrderBy(e => e.DataEvento)
            .ToListAsync();

        var acessos = eventos
            .Select(e => new AcessoEvento(
                e,
                formandos.FirstOrDefault(f => f.EventoId == e.Id),
                e.UsuarioId == usuarioId,
                e.UsuarioId != usuarioId && e.Tipo != TipoEvento.Formatura && idsComoCoOrganizador.Contains(e.Id)))
            .ToList();

        return Resultado<List<AcessoEvento>>.Ok(acessos);
    }

    public Task<Resultado<AcessoEvento>> ObterAsync(int usuarioId, int id) =>
        ControleAcesso.ExigirAsync(banco, usuarioId, id, Permissao.VerEvento);

    public async Task<Resultado<AcessoEvento>> CriarAsync(int usuarioId, CriarEventoRequisicao requisicao)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.NomeEvento))
            erros["nomeEvento"] = ["Informe o nome do evento."];
        if (!Enum.IsDefined(requisicao.Tipo))
            erros["tipo"] = ["Tipo de evento inválido."];
        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);

        if (erros.Count > 0)
            return Resultado<AcessoEvento>.Invalido(erros);

        var evento = new Evento
        {
            UsuarioId = usuarioId,
            Tipo = requisicao.Tipo,
            DataEvento = ParaUtc(requisicao.DataEvento),
            NomeEvento = requisicao.NomeEvento.Trim(),
            Local = TextoOpcional(requisicao.Local),
            Descricao = TextoOpcional(requisicao.Descricao),
            CorPrincipal = TextoOpcional(requisicao.CorPrincipal),
            CorSecundaria = TextoOpcional(requisicao.CorSecundaria),
            SlugPublico = await GerarSlugUnicoAsync(requisicao.NomeEvento),
        };

        banco.Eventos.Add(evento);
        await banco.SaveChangesAsync();

        return Resultado<AcessoEvento>.Ok(new AcessoEvento(evento, null, Organizador: true));
    }

    public async Task<Resultado<AcessoEvento>> AtualizarAsync(int usuarioId, int id, AtualizarEventoRequisicao requisicao)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, id, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso;

        var evento = acesso.Valor!.Evento;
        var erros = new Dictionary<string, string[]>();

        if (requisicao.Tipo is TipoEvento tipo)
        {
            if (!Enum.IsDefined(tipo))
                erros["tipo"] = ["Tipo de evento inválido."];
            else if (evento.Tipo == TipoEvento.Formatura && tipo != TipoEvento.Formatura
                && await banco.Formandos.AnyAsync(f => f.EventoId == evento.Id))
                erros["tipo"] = ["Esta formatura já tem formandos. Exclua os formandos antes de mudar o tipo do evento."];
            else if (evento.Tipo != TipoEvento.Formatura && tipo == TipoEvento.Formatura
                && await banco.CoOrganizadores.AnyAsync(c => c.EventoId == evento.Id))
                erros["tipo"] = ["Este evento tem co-organizadores. Remova-os antes de transformá-lo em formatura (lá a equipe é a comissão)."];
            else
                evento.Tipo = tipo;
        }

        if (requisicao.DataEvento is DateTime data)
            evento.DataEvento = ParaUtc(data);

        if (requisicao.NomeEvento is not null)
        {
            if (string.IsNullOrWhiteSpace(requisicao.NomeEvento))
                erros["nomeEvento"] = ["O nome do evento não pode ficar vazio."];
            else
                evento.NomeEvento = requisicao.NomeEvento.Trim();
        }

        if (requisicao.SlugPublico is not null)
        {
            var slug = requisicao.SlugPublico.Trim().ToLowerInvariant();
            if (slug != GerarSlug(slug, "evento", TamanhoMaximoSlug))
                erros["slugPublico"] = ["Use apenas letras minúsculas sem acento, números e hífens."];
            else if (slug != evento.SlugPublico && await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
                return Resultado<AcessoEvento>.Falha(TipoErro.Conflito, "Este endereço já está em uso por outro evento.");
            else
                evento.SlugPublico = slug;
        }

        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);
        AplicarPix(evento, requisicao, erros);

        var mensagemAgradecimento = TextoOpcional(requisicao.MensagemAgradecimento);
        if (mensagemAgradecimento?.Length > 1000)
            erros["mensagemAgradecimento"] = ["A mensagem pode ter no máximo 1000 caracteres."];

        if (erros.Count > 0)
            return Resultado<AcessoEvento>.Invalido(erros);

        if (requisicao.Local is not null)
            evento.Local = TextoOpcional(requisicao.Local);
        if (requisicao.Descricao is not null)
            evento.Descricao = TextoOpcional(requisicao.Descricao);
        if (requisicao.CorPrincipal is not null)
            evento.CorPrincipal = TextoOpcional(requisicao.CorPrincipal);
        if (requisicao.CorSecundaria is not null)
            evento.CorSecundaria = TextoOpcional(requisicao.CorSecundaria);
        if (requisicao.ListaPresentesAtiva is bool listaPresentesAtiva)
            evento.ListaPresentesAtiva = listaPresentesAtiva;
        if (requisicao.MuralAtivo is bool muralAtivo)
            evento.MuralAtivo = muralAtivo;
        if (requisicao.MensagemAgradecimento is not null)
            evento.MensagemAgradecimento = mensagemAgradecimento;

        await banco.SaveChangesAsync();
        return acesso;
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int id)
    {
        // Só quem criou o evento pode excluí-lo (nem os administradores da comissão)
        var acesso = await ControleAcesso.ObterAsync(banco, usuarioId, id);
        if (acesso is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, ControleAcesso.MensagemEventoNaoEncontrado);
        if (!acesso.Organizador)
            return Resultado<bool>.Falha(TipoErro.SemPermissao, "Só quem criou o evento pode excluí-lo.");

        var evento = acesso.Evento;

        // Convidados, presentes e fotos do evento são excluídos junto (cascata no banco);
        // os arquivos das fotos e do banner precisam ser apagados do armazenamento à parte
        banco.Eventos.Remove(evento);
        await banco.SaveChangesAsync();
        await armazenamento.ExcluirPastaEventoAsync(id);
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Troca a imagem de capa do evento (usada no banner da página pública e no cartão do evento).</summary>
    public async Task<Resultado<AcessoEvento>> EnviarBannerAsync(int usuarioId, int id, IFormFile? arquivo)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, id, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso;

        var evento = acesso.Valor!.Evento;

        if (arquivo is null || arquivo.Length == 0)
            return Resultado<AcessoEvento>.Invalido(new() { ["arquivo"] = ["Escolha uma imagem para o banner."] });
        if (arquivo.Length > TamanhoMaximoBannerBytes)
            return Resultado<AcessoEvento>.Invalido(new()
            {
                ["arquivo"] = [$"A imagem pode ter no máximo {TamanhoMaximoBannerBytes / 1024 / 1024} MB."],
            });

        // Lê o começo do arquivo para conferir se é mesmo uma imagem
        var extensao = await ArmazenamentoArquivos.DetectarExtensaoImagemAsync(arquivo);
        if (extensao is null)
            return Resultado<AcessoEvento>.Invalido(new() { ["arquivo"] = ["Envie uma imagem JPG, PNG, GIF ou WEBP."] });

        var bannerAnterior = evento.Banner;
        await using (var conteudo = arquivo.OpenReadStream())
            evento.Banner = await armazenamento.SalvarBannerAsync(evento.Id, conteudo, extensao);

        await banco.SaveChangesAsync();
        if (bannerAnterior is not null)
            await armazenamento.ExcluirBannerAsync(evento.Id, bannerAnterior);

        return acesso;
    }

    /// <summary>Remove a imagem de capa; a página volta a usar a imagem padrão.</summary>
    public async Task<Resultado<AcessoEvento>> RemoverBannerAsync(int usuarioId, int id)
    {
        var acesso = await ControleAcesso.ExigirAsync(banco, usuarioId, id, Permissao.GerenciarEvento);
        if (!acesso.Sucesso)
            return acesso;

        var evento = acesso.Valor!.Evento;

        if (evento.Banner is string banner)
        {
            evento.Banner = null;
            await banco.SaveChangesAsync();
            await armazenamento.ExcluirBannerAsync(evento.Id, banner);
        }

        return acesso;
    }

    /// <summary>Endereço público do banner, ou nulo se o evento usa a imagem padrão.</summary>
    public static string? UrlDoBanner(Evento evento) =>
        evento.Banner is null ? null : $"/api/banners/{evento.Id}/{evento.Banner}";

    /// <summary>
    /// Dados do Pix estático. Chave vazia ("") desativa o Pix na página pública;
    /// com chave, o nome do recebedor e a cidade também são obrigatórios (o BR Code exige).
    /// </summary>
    private static void AplicarPix(Evento evento, AtualizarEventoRequisicao requisicao, Dictionary<string, string[]> erros)
    {
        if (requisicao.ChavePix is not null)
        {
            if (TextoOpcional(requisicao.ChavePix) is null)
                evento.ChavePix = null;
            else if (NormalizarChavePix(requisicao.ChavePix) is string chave)
                evento.ChavePix = chave;
            else
                erros["chavePix"] = ["Chave Pix inválida. Use CPF, CNPJ, e-mail, telefone com +55 ou chave aleatória."];
        }

        if (requisicao.NomeRecebedorPix is not null)
        {
            var nome = GeradorPix.TextoSemAcento(requisicao.NomeRecebedorPix, GeradorPix.TamanhoMaximoNome);
            evento.NomeRecebedorPix = nome.Length == 0 ? null : nome;
        }

        if (requisicao.CidadePix is not null)
        {
            var cidade = GeradorPix.TextoSemAcento(requisicao.CidadePix, GeradorPix.TamanhoMaximoCidade);
            evento.CidadePix = cidade.Length == 0 ? null : cidade;
        }

        if (evento.ChavePix is not null && !erros.ContainsKey("chavePix"))
        {
            if (evento.NomeRecebedorPix is null)
                erros["nomeRecebedorPix"] = ["Informe o nome de quem vai receber o Pix."];
            if (evento.CidadePix is null)
                erros["cidadePix"] = ["Informe a cidade de quem vai receber o Pix."];
        }
    }

    private static void ValidarCores(string? corPrincipal, string? corSecundaria, Dictionary<string, string[]> erros)
    {
        if (!CorValida(TextoOpcional(corPrincipal)))
            erros["corPrincipal"] = ["Use uma cor no formato #RRGGBB."];
        if (!CorValida(TextoOpcional(corSecundaria)))
            erros["corSecundaria"] = ["Use uma cor no formato #RRGGBB."];
    }

    /// <summary>Gera um endereço público único a partir do nome, ex.: "casamento-ana-e-pedro-2".</summary>
    private async Task<string> GerarSlugUnicoAsync(string nomeEvento)
    {
        var slugBase = GerarSlug(nomeEvento, "evento", TamanhoMaximoSlug);
        var slug = slugBase;
        var sufixo = 2;

        while (await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
            slug = $"{slugBase}-{sufixo++}";

        return slug;
    }
}
