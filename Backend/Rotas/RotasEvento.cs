using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de evento: só recebem a requisição, chamam o ServicoEvento e traduzem o resultado para HTTP.
/// Todas exigem login; o que cada um pode fazer depende do papel dele no evento (ver ControleAcesso).
/// </summary>
public static class RotasEvento
{
    public static void MapearRotasEvento(this WebApplication app)
    {
        var eventos = app.MapGroup("/api/eventos").WithTags("Eventos").RequireAuthorization();
        eventos.MapGet("/", Listar);
        eventos.MapPost("/", Criar);
        eventos.MapGet("/{id:int}", Obter);
        eventos.MapPut("/{id:int}", Atualizar);
        eventos.MapDelete("/{id:int}", Excluir);

        // Envio de arquivo (multipart/form-data). Não há formulário do servidor, então o antiforgery não se aplica.
        eventos.MapPut("/{id:int}/banner", EnviarBanner).DisableAntiforgery();
        eventos.MapDelete("/{id:int}/banner", RemoverBanner);

        // Arquivo do banner, sem login (aparece na página pública e funciona em <img src>)
        app.MapGet("/api/banners/{eventoId:int}/{arquivo}", BaixarBanner).WithTags("Eventos");
    }

    private static async Task<IResult> Listar(ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ListarAsync(usuarioId);
        return ParaHttp(resultado, acessos => Results.Ok(acessos.Select(ParaResposta)));
    }

    private static async Task<IResult> Criar(
        CriarEventoRequisicao requisicao, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.CriarAsync(usuarioId, requisicao);
        return ParaHttp(resultado, acesso => Results.Created($"/api/eventos/{acesso.Evento.Id}", ParaResposta(acesso)));
    }

    private static async Task<IResult> Obter(int id, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ObterAsync(usuarioId, id);
        return ParaHttp(resultado, acesso => Results.Ok(ParaResposta(acesso)));
    }

    private static async Task<IResult> Atualizar(
        int id, AtualizarEventoRequisicao requisicao, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.AtualizarAsync(usuarioId, id, requisicao);
        return ParaHttp(resultado, acesso => Results.Ok(ParaResposta(acesso)));
    }

    private static async Task<IResult> Excluir(int id, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.ExcluirAsync(usuarioId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static async Task<IResult> EnviarBanner(
        int id, IFormFile? arquivo, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.EnviarBannerAsync(usuarioId, id, arquivo);
        return ParaHttp(resultado, acesso => Results.Ok(ParaResposta(acesso)));
    }

    private static async Task<IResult> RemoverBanner(int id, ClaimsPrincipal principal, ServicoEvento servicoEvento)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoEvento.RemoverBannerAsync(usuarioId, id);
        return ParaHttp(resultado, acesso => Results.Ok(ParaResposta(acesso)));
    }

    private static async Task<IResult> BaixarBanner(int eventoId, string arquivo, ArmazenamentoArquivos armazenamento) =>
        await armazenamento.AbrirBannerAsync(eventoId, arquivo) switch
        {
            ImagemGuardada.EmDisco disco => Results.File(disco.Caminho, ArmazenamentoArquivos.TipoConteudo(arquivo)),
            // Bucket privado: manda o navegador para um link assinado e temporário
            ImagemGuardada.LinkTemporario link => Results.Redirect(link.Url),
            _ => Results.NotFound(new { mensagem = "Imagem não encontrada." }),
        };

    /// <summary>Usado também pelas rotas de convite, que devolvem o evento em que a pessoa entrou.</summary>
    internal static EventoResposta ParaResposta(AcessoEvento acesso)
    {
        var evento = acesso.Evento;
        return new(
            evento.Id,
            evento.PlanoAtualId,
            evento.Tipo,
            evento.DataEvento,
            evento.NomeEvento,
            evento.Local,
            evento.SlugPublico,
            evento.Descricao,
            evento.CorPrincipal,
            evento.CorSecundaria,
            evento.ChavePix,
            evento.NomeRecebedorPix,
            evento.CidadePix,
            evento.ListaPresentesAtiva,
            evento.MuralAtivo,
            ServicoEvento.UrlDoBanner(evento),
            evento.CriadoEm,
            acesso.Organizador,
            acesso.Papel,
            acesso.Permissoes,
            acesso.Pode(Permissao.GerenciarComissao) ? evento.CodigoTurma : null,
            evento.MensagemAgradecimento,
            acesso.CoOrganizador);
    }
}
