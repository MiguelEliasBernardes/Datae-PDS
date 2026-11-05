using System.Security.Claims;
using Backend.Dtos;
using Backend.Modelos;
using Backend.Servicos;
using static Backend.Rotas.AuxiliaresRotas;

namespace Backend.Rotas;

/// <summary>
/// Rotas de moderação do mural: só recebem a requisição, chamam o ServicoMural e traduzem o resultado para HTTP.
/// Ficam "dentro" do evento: /api/eventos/{eventoId}/fotos. O envio das fotos fica nas RotasPublicas.
/// </summary>
public static class RotasMural
{
    public static void MapearRotasMural(this WebApplication app)
    {
        var fotos = app.MapGroup("/api/eventos/{eventoId:int}/fotos")
            .WithTags("Mural de fotos")
            .RequireAuthorization();

        fotos.MapGet("/", Listar);
        fotos.MapPut("/{id:int}", Moderar);
        fotos.MapDelete("/{id:int}", Excluir);

        // Arquivo da imagem, sem login (para funcionar em <img src>). O nome é aleatório e impossível de adivinhar.
        app.MapGet("/api/mural/arquivos/{eventoId:int}/{arquivo}", BaixarArquivo).WithTags("Mural de fotos");
    }

    // Filtro opcional: /fotos?status=Pendente
    private static async Task<IResult> Listar(
        int eventoId, StatusFoto? status, ClaimsPrincipal principal, ServicoMural servicoMural)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoMural.ListarAsync(usuarioId, eventoId, status);
        return ParaHttp(resultado, fotos => Results.Ok(fotos.Select(ParaResposta)));
    }

    private static async Task<IResult> Moderar(
        int eventoId, int id, ModerarFotoRequisicao requisicao, ClaimsPrincipal principal, ServicoMural servicoMural)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoMural.ModerarAsync(usuarioId, eventoId, id, requisicao.Status);
        return ParaHttp(resultado, foto => Results.Ok(ParaResposta(foto)));
    }

    private static async Task<IResult> Excluir(int eventoId, int id, ClaimsPrincipal principal, ServicoMural servicoMural)
    {
        if (ObterIdUsuarioLogado(principal) is not int usuarioId)
            return Results.Unauthorized();

        var resultado = await servicoMural.ExcluirAsync(usuarioId, eventoId, id);
        return ParaHttp(resultado, _ => Results.NoContent());
    }

    private static IResult BaixarArquivo(int eventoId, string arquivo, ArmazenamentoArquivos armazenamento)
    {
        if (armazenamento.AbrirFotoMural(eventoId, arquivo) is not { } foto)
            return Results.NotFound(new { mensagem = "Foto não encontrada." });

        return Results.File(foto.Caminho, foto.TipoConteudo);
    }

    private static FotoResposta ParaResposta(FotoMural foto) => new(
        foto.Id,
        foto.EventoId,
        foto.NomeAutor,
        ServicoMural.UrlDaFoto(foto),
        foto.Status,
        foto.EnviadaEm);
}
