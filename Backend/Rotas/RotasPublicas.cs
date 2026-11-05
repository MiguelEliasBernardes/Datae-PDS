using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using Microsoft.AspNetCore.Mvc;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas da página pública do evento, usadas pelos convidados SEM login.
/// O evento é identificado pelo slug: /api/publico/eventos/{slug}.
/// As rotas que gravam dados têm limite de requisições por IP (política "publico").
/// </summary>
public static class RotasPublicas
{
    public const string PoliticaLimite = "publico";

    public static void MapearRotasPublicas(this WebApplication app)
    {
        var publico = app.MapGroup("/api/publico/eventos/{slug}").WithTags("Página pública");

        publico.MapGet("/", ObterEvento);
        publico.MapGet("/presentes", ListarPresentes);
        publico.MapGet("/fotos", ListarFotos);

        publico.MapPost("/presenca", ConfirmarPresenca).RequireRateLimiting(PoliticaLimite);
        publico.MapPost("/presentes/{id:int}/reserva", ReservarPresente).RequireRateLimiting(PoliticaLimite);
        publico.MapPost("/presentes/{id:int}/comprado", MarcarComprado).RequireRateLimiting(PoliticaLimite);
        publico.MapPost("/presentes/{id:int}/cancelar-reserva", CancelarReserva).RequireRateLimiting(PoliticaLimite);
        publico.MapPost("/pix", GerarPix).RequireRateLimiting(PoliticaLimite);

        // Envio de arquivo (multipart/form-data). Não há formulário do servidor, então o antiforgery não se aplica.
        publico.MapPost("/fotos", EnviarFoto).RequireRateLimiting(PoliticaLimite).DisableAntiforgery();
    }

    private static async Task<IResult> ObterEvento(string slug, ServicoPaginaPublica servico)
    {
        var resultado = await servico.ObterEventoAsync(slug);
        return ParaHttp(resultado, evento => Results.Ok(ParaResposta(evento)));
    }

    private static async Task<IResult> ListarPresentes(string slug, ServicoPaginaPublica servico)
    {
        var resultado = await servico.ListarPresentesAsync(slug);
        return ParaHttp(resultado, presentes => Results.Ok(presentes.Select(ParaResposta)));
    }

    private static async Task<IResult> ConfirmarPresenca(
        string slug, ConfirmarPresencaRequisicao requisicao, ServicoPaginaPublica servico)
    {
        var resultado = await servico.ConfirmarPresencaAsync(slug, requisicao);
        return ParaHttp(resultado, convidado => Results.Ok(new PresencaResposta(
            convidado.Nome, convidado.StatusPresenca, convidado.QuantidadeAcompanhantes, convidado.Observacao)));
    }

    private static async Task<IResult> ReservarPresente(
        string slug, int id, ReservarPresenteRequisicao requisicao, ServicoPaginaPublica servico)
    {
        var resultado = await servico.ReservarPresenteAsync(slug, id, requisicao);
        return ParaHttp(resultado, reserva => Results.Ok(new ReservaResposta(ParaResposta(reserva.Presente), reserva.Codigo)));
    }

    private static async Task<IResult> MarcarComprado(
        string slug, int id, AcaoReservaRequisicao requisicao, ServicoPaginaPublica servico)
    {
        var resultado = await servico.MarcarCompradoAsync(slug, id, requisicao);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> CancelarReserva(
        string slug, int id, AcaoReservaRequisicao requisicao, ServicoPaginaPublica servico)
    {
        var resultado = await servico.CancelarReservaAsync(slug, id, requisicao);
        return ParaHttp(resultado, presente => Results.Ok(ParaResposta(presente)));
    }

    private static async Task<IResult> GerarPix(string slug, GerarPixRequisicao requisicao, ServicoPaginaPublica servico)
    {
        var resultado = await servico.GerarPixAsync(slug, requisicao);
        return ParaHttp(resultado, Results.Ok);
    }

    private static async Task<IResult> ListarFotos(string slug, ServicoMural servicoMural)
    {
        var resultado = await servicoMural.ListarAprovadasAsync(slug);
        return ParaHttp(resultado, fotos => Results.Ok(fotos.Select(f =>
            new FotoPublicaResposta(f.Id, f.NomeAutor, ServicoMural.UrlDaFoto(f), f.EnviadaEm))));
    }

    private static async Task<IResult> EnviarFoto(
        string slug, IFormFile? arquivo, [FromForm] string? nomeAutor, ServicoMural servicoMural)
    {
        var resultado = await servicoMural.EnviarFotoAsync(slug, arquivo, nomeAutor);

        // A foto fica pendente até o organizador aprovar, por isso a resposta não traz o endereço dela
        return ParaHttp(resultado, foto => Results.Json(
            new { id = foto.Id, status = foto.Status, mensagem = "Foto enviada! Ela aparece no mural depois de aprovada." },
            statusCode: StatusCodes.Status201Created));
    }

    private static EventoPublicoResposta ParaResposta(Evento evento) => new(
        evento.Tipo,
        evento.DataEvento,
        evento.NomeEvento,
        evento.Local,
        evento.SlugPublico,
        evento.Descricao,
        evento.CorPrincipal,
        evento.CorSecundaria,
        evento.ChavePix is not null && evento.NomeRecebedorPix is not null && evento.CidadePix is not null,
        evento.NomeRecebedorPix);

    private static PresentePublicoResposta ParaResposta(ItemPresente presente) => new(
        presente.Id,
        presente.Nome,
        presente.Descricao,
        presente.ValorEstimado,
        presente.Status,
        presente.LinkAfiliado,
        presente.Foto);
}
