using Backend.Dados;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Mural de fotos: convidados enviam pela página pública (sem login) e as fotos ficam
/// pendentes até o organizador aprovar. Só as aprovadas aparecem para os convidados.
/// </summary>
public class ServicoMural(ContextoBanco banco, ArmazenamentoArquivos armazenamento)
{
    public const long TamanhoMaximoBytes = 10 * 1024 * 1024;
    private const int MaximoFotosPorEvento = 500;

    // ===== Página pública =====

    public async Task<Resultado<FotoMural>> EnviarFotoAsync(string slug, IFormFile? arquivo, string? nomeAutor)
    {
        var slugNormalizado = (slug ?? string.Empty).Trim().ToLowerInvariant();
        var evento = await banco.Eventos.FirstOrDefaultAsync(e => e.SlugPublico == slugNormalizado);
        if (evento is null)
            return Resultado<FotoMural>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado. Confira o link do convite.");

        var autor = TextoOpcional(nomeAutor) is null ? null : NormalizarNome(nomeAutor);
        var erros = new Dictionary<string, string[]>();

        if (arquivo is null || arquivo.Length == 0)
            erros["arquivo"] = ["Escolha uma foto para enviar."];
        else if (arquivo.Length > TamanhoMaximoBytes)
            erros["arquivo"] = [$"A foto pode ter no máximo {TamanhoMaximoBytes / 1024 / 1024} MB."];
        if (autor?.Length > 120)
            erros["nomeAutor"] = ["O nome pode ter no máximo 120 caracteres."];

        if (erros.Count > 0)
            return Resultado<FotoMural>.Invalido(erros);

        // Lê o começo do arquivo para conferir se é mesmo uma imagem
        var inicio = new byte[12];
        int lidos;
        await using (var cabecalho = arquivo!.OpenReadStream())
            lidos = await cabecalho.ReadAtLeastAsync(inicio, inicio.Length, throwOnEndOfStream: false);

        var extensao = ArmazenamentoArquivos.DetectarExtensaoImagem(inicio.AsSpan(0, lidos));
        if (extensao is null)
            return Resultado<FotoMural>.Invalido(new() { ["arquivo"] = ["Envie uma imagem JPG, PNG, GIF ou WEBP."] });

        if (await banco.FotosMural.CountAsync(f => f.EventoId == evento.Id) >= MaximoFotosPorEvento)
            return Resultado<FotoMural>.Falha(TipoErro.Conflito, "O mural deste evento atingiu o limite de fotos.");

        await using var conteudo = arquivo.OpenReadStream();
        var nomeArquivo = await armazenamento.SalvarFotoMuralAsync(evento.Id, conteudo, extensao);

        var foto = new FotoMural { EventoId = evento.Id, NomeAutor = autor, Arquivo = nomeArquivo };
        banco.FotosMural.Add(foto);
        await banco.SaveChangesAsync();

        return Resultado<FotoMural>.Ok(foto);
    }

    public async Task<Resultado<List<FotoMural>>> ListarAprovadasAsync(string slug)
    {
        var slugNormalizado = (slug ?? string.Empty).Trim().ToLowerInvariant();
        var eventoId = await banco.Eventos
            .Where(e => e.SlugPublico == slugNormalizado)
            .Select(e => (int?)e.Id)
            .FirstOrDefaultAsync();

        if (eventoId is null)
            return Resultado<List<FotoMural>>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado. Confira o link do convite.");

        var fotos = await banco.FotosMural
            .Where(f => f.EventoId == eventoId && f.Status == StatusFoto.Aprovada)
            .OrderByDescending(f => f.EnviadaEm)
            .ToListAsync();

        return Resultado<List<FotoMural>>.Ok(fotos);
    }

    // ===== Moderação (organizador) =====

    public async Task<Resultado<List<FotoMural>>> ListarAsync(int usuarioId, int eventoId, StatusFoto? status)
    {
        if (!await EventoDoUsuarioAsync(usuarioId, eventoId))
            return Resultado<List<FotoMural>>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        var consulta = banco.FotosMural.Where(f => f.EventoId == eventoId);
        if (status is not null)
            consulta = consulta.Where(f => f.Status == status);

        return Resultado<List<FotoMural>>.Ok(await consulta.OrderByDescending(f => f.EnviadaEm).ToListAsync());
    }

    public async Task<Resultado<FotoMural>> ModerarAsync(int usuarioId, int eventoId, int id, StatusFoto status)
    {
        var foto = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (foto is null)
            return FotoNaoEncontrada();

        if (!Enum.IsDefined(status))
            return Resultado<FotoMural>.Invalido(new() { ["status"] = ["Status da foto inválido."] });

        foto.Status = status;
        await banco.SaveChangesAsync();
        return Resultado<FotoMural>.Ok(foto);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int eventoId, int id)
    {
        var foto = await BuscarDoUsuarioAsync(usuarioId, eventoId, id);
        if (foto is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Foto não encontrada.");

        banco.FotosMural.Remove(foto);
        await banco.SaveChangesAsync();
        armazenamento.ExcluirFotoMural(eventoId, foto.Arquivo);
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Endereço público do arquivo da foto (o nome aleatório impede adivinhar fotos pendentes).</summary>
    public static string UrlDaFoto(FotoMural foto) => $"/api/mural/arquivos/{foto.EventoId}/{foto.Arquivo}";

    private Task<bool> EventoDoUsuarioAsync(int usuarioId, int eventoId) =>
        banco.Eventos.AnyAsync(e => e.Id == eventoId && e.UsuarioId == usuarioId);

    private Task<FotoMural?> BuscarDoUsuarioAsync(int usuarioId, int eventoId, int id) =>
        banco.FotosMural.FirstOrDefaultAsync(f =>
            f.Id == id &&
            f.EventoId == eventoId &&
            banco.Eventos.Any(e => e.Id == eventoId && e.UsuarioId == usuarioId));

    private static Resultado<FotoMural> FotoNaoEncontrada() =>
        Resultado<FotoMural>.Falha(TipoErro.NaoEncontrado, "Foto não encontrada.");
}
