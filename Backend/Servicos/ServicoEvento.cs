using System.Globalization;
using System.Text;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoEvento(ContextoBanco banco)
{
    private const int TamanhoMaximoSlug = 150;

    public async Task<Resultado<List<Evento>>> ListarAsync(int usuarioId)
    {
        var eventos = await banco.Eventos
            .Where(e => e.UsuarioId == usuarioId)
            .OrderBy(e => e.DataEvento)
            .ToListAsync();

        return Resultado<List<Evento>>.Ok(eventos);
    }

    public async Task<Resultado<Evento>> ObterAsync(int usuarioId, int id)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        return evento is null ? EventoNaoEncontrado() : Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<Evento>> CriarAsync(int usuarioId, CriarEventoRequisicao requisicao)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.NomeEvento))
            erros["nomeEvento"] = ["Informe o nome do evento."];
        if (!Enum.IsDefined(requisicao.Tipo))
            erros["tipo"] = ["Tipo de evento inválido."];
        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);

        if (erros.Count > 0)
            return Resultado<Evento>.Invalido(erros);

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

        return Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<Evento>> AtualizarAsync(int usuarioId, int id, AtualizarEventoRequisicao requisicao)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return EventoNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Tipo is TipoEvento tipo)
        {
            if (!Enum.IsDefined(tipo))
                erros["tipo"] = ["Tipo de evento inválido."];
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
            if (slug != GerarSlugBase(slug))
                erros["slugPublico"] = ["Use apenas letras minúsculas sem acento, números e hífens."];
            else if (slug != evento.SlugPublico && await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
                return Resultado<Evento>.Falha(TipoErro.Conflito, "Este endereço já está em uso por outro evento.");
            else
                evento.SlugPublico = slug;
        }

        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);

        if (erros.Count > 0)
            return Resultado<Evento>.Invalido(erros);

        if (requisicao.Local is not null)
            evento.Local = TextoOpcional(requisicao.Local);
        if (requisicao.Descricao is not null)
            evento.Descricao = TextoOpcional(requisicao.Descricao);
        if (requisicao.CorPrincipal is not null)
            evento.CorPrincipal = TextoOpcional(requisicao.CorPrincipal);
        if (requisicao.CorSecundaria is not null)
            evento.CorSecundaria = TextoOpcional(requisicao.CorSecundaria);

        await banco.SaveChangesAsync();
        return Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int id)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        // Convidados e presentes do evento são excluídos junto (cascata no banco)
        banco.Eventos.Remove(evento);
        await banco.SaveChangesAsync();
        return Resultado<bool>.Ok(true);
    }

    // Só encontra eventos do próprio usuário; evento de outra pessoa aparece como "não encontrado"
    private Task<Evento?> BuscarDoUsuarioAsync(int usuarioId, int id) =>
        banco.Eventos.FirstOrDefaultAsync(e => e.Id == id && e.UsuarioId == usuarioId);

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
        var slugBase = GerarSlugBase(nomeEvento);
        var slug = slugBase;
        var sufixo = 2;

        while (await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
            slug = $"{slugBase}-{sufixo++}";

        return slug;
    }

    /// <summary>"Casamento de Ana & Pedro" vira "casamento-de-ana-pedro".</summary>
    private static string GerarSlugBase(string texto)
    {
        var semAcento = new StringBuilder();
        foreach (var caractere in texto.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
                semAcento.Append(caractere);
        }

        var slug = new StringBuilder();
        foreach (var caractere in semAcento.ToString().ToLowerInvariant())
        {
            if (char.IsAsciiLetterOrDigit(caractere))
                slug.Append(caractere);
            else if (slug.Length > 0 && slug[^1] != '-')
                slug.Append('-');
        }

        var resultado = slug.ToString().Trim('-');
        if (resultado.Length > TamanhoMaximoSlug)
            resultado = resultado[..TamanhoMaximoSlug].Trim('-');

        return resultado.Length == 0 ? "evento" : resultado;
    }

    private static Resultado<Evento> EventoNaoEncontrado() =>
        Resultado<Evento>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");
}
