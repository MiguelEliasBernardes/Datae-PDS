using System.Security.Cryptography;
using System.Text;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

/// <summary>
/// Tudo o que o convidado faz na página pública do evento, sem login: ver o evento,
/// confirmar presença, reservar presente e gerar o Pix. O evento é sempre localizado pelo slug.
/// </summary>
public class ServicoPaginaPublica(ContextoBanco banco)
{
    public const int MaximoAcompanhantes = 10;
    private const decimal ValorMaximoPix = 100_000m;

    public async Task<Resultado<Evento>> ObterEventoAsync(string slug)
    {
        var evento = await BuscarPorSlugAsync(slug);
        return evento is null ? EventoNaoEncontrado<Evento>() : Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<List<ItemPresente>>> ListarPresentesAsync(string slug)
    {
        var evento = await BuscarPorSlugAsync(slug);
        if (evento is null)
            return EventoNaoEncontrado<List<ItemPresente>>();

        // Disponíveis primeiro, para o convidado achar logo o que ainda pode reservar
        var presentes = await banco.ItensPresente
            .Where(p => p.EventoId == evento.Id)
            .OrderBy(p => p.Status != StatusPresente.Disponivel)
            .ThenBy(p => p.Nome)
            .ToListAsync();

        return Resultado<List<ItemPresente>>.Ok(presentes);
    }

    /// <summary>
    /// RSVP: procura o convidado pelo nome (sem diferenciar maiúsculas) na lista do organizador.
    /// Se encontrar, atualiza a resposta; se não, adiciona o convidado à lista.
    /// </summary>
    public async Task<Resultado<Convidado>> ConfirmarPresencaAsync(string slug, ConfirmarPresencaRequisicao requisicao)
    {
        var evento = await BuscarPorSlugAsync(slug);
        if (evento is null)
            return EventoNaoEncontrado<Convidado>();

        var nome = NormalizarNome(requisicao.Nome);
        var acompanhantes = requisicao.VaiComparecer ? requisicao.QuantidadeAcompanhantes ?? 0 : 0;
        var observacao = TextoOpcional(requisicao.Observacao);
        var erros = new Dictionary<string, string[]>();

        if (nome.Length == 0)
            erros["nome"] = ["Informe seu nome."];
        else if (nome.Length > 120)
            erros["nome"] = ["O nome pode ter no máximo 120 caracteres."];
        if (acompanhantes is < 0 or > MaximoAcompanhantes)
            erros["quantidadeAcompanhantes"] = [$"Informe de 0 a {MaximoAcompanhantes} acompanhantes."];
        if (observacao?.Length > 500)
            erros["observacao"] = ["A observação pode ter no máximo 500 caracteres."];

        if (erros.Count > 0)
            return Resultado<Convidado>.Invalido(erros);

        var convidado = await BuscarOuCriarConvidadoAsync(evento.Id, nome);
        convidado.StatusPresenca = requisicao.VaiComparecer ? StatusPresenca.Confirmado : StatusPresenca.Recusado;
        convidado.QuantidadeAcompanhantes = acompanhantes;
        // Só sobrescreve a observação se o convidado escreveu algo, para não apagar a anotação anterior
        if (observacao is not null)
            convidado.Observacao = observacao;

        await banco.SaveChangesAsync();
        return Resultado<Convidado>.Ok(convidado);
    }

    /// <summary>
    /// Reserva o presente para o convidado. A troca de Disponivel para Reservado é feita num único
    /// UPDATE condicionado ao status, então se duas pessoas clicarem ao mesmo tempo só uma consegue.
    /// </summary>
    public async Task<Resultado<(ItemPresente Presente, string Codigo)>> ReservarPresenteAsync(
        string slug, int presenteId, ReservarPresenteRequisicao requisicao)
    {
        var evento = await BuscarPorSlugAsync(slug);
        if (evento is null)
            return EventoNaoEncontrado<(ItemPresente, string)>();

        var nome = NormalizarNome(requisicao.Nome);
        if (nome.Length == 0)
            return Resultado<(ItemPresente, string)>.Invalido(new() { ["nome"] = ["Informe seu nome para reservar."] });
        if (nome.Length > 120)
            return Resultado<(ItemPresente, string)>.Invalido(new() { ["nome"] = ["O nome pode ter no máximo 120 caracteres."] });

        var presente = await banco.ItensPresente.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == presenteId && p.EventoId == evento.Id);
        if (presente is null)
            return PresenteNaoEncontrado<(ItemPresente, string)>();
        if (presente.Status != StatusPresente.Disponivel)
            return PresenteIndisponivel<(ItemPresente, string)>();

        await using var transacao = await banco.Database.BeginTransactionAsync();

        var convidado = await BuscarOuCriarConvidadoAsync(evento.Id, nome);
        await banco.SaveChangesAsync();

        var codigo = Guid.NewGuid().ToString("N");
        var novoStatus = requisicao.JaComprado == true ? StatusPresente.Comprado : StatusPresente.Reservado;

        var alterados = await banco.ItensPresente
            .Where(p => p.Id == presenteId && p.Status == StatusPresente.Disponivel)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, novoStatus)
                .SetProperty(p => p.ConvidadoId, convidado.Id)
                .SetProperty(p => p.CodigoReserva, codigo));

        // Alguém reservou entre a consulta e o UPDATE: desfaz o convidado criado agora
        if (alterados == 0)
            return PresenteIndisponivel<(ItemPresente, string)>();

        await transacao.CommitAsync();

        presente.Status = novoStatus;
        presente.ConvidadoId = convidado.Id;
        return Resultado<(ItemPresente, string)>.Ok((presente, codigo));
    }

    /// <summary>Quem reservou avisa que já comprou o presente.</summary>
    public Task<Resultado<ItemPresente>> MarcarCompradoAsync(string slug, int presenteId, AcaoReservaRequisicao requisicao) =>
        AlterarReservaAsync(slug, presenteId, requisicao.CodigoReserva, presente =>
        {
            presente.Status = StatusPresente.Comprado;
            return null;
        });

    /// <summary>Quem reservou desiste; o presente volta a ficar disponível para os outros.</summary>
    public Task<Resultado<ItemPresente>> CancelarReservaAsync(string slug, int presenteId, AcaoReservaRequisicao requisicao) =>
        AlterarReservaAsync(slug, presenteId, requisicao.CodigoReserva, presente =>
        {
            if (presente.Status == StatusPresente.Comprado)
                return "Este presente já foi marcado como comprado. Fale com o organizador para desfazer.";

            presente.Status = StatusPresente.Disponivel;
            presente.ConvidadoId = null;
            presente.CodigoReserva = null;
            return null;
        });

    /// <summary>Gera o "Pix copia e cola" e o QR Code com o valor escolhido pelo convidado (opcional).</summary>
    public async Task<Resultado<PixResposta>> GerarPixAsync(string slug, GerarPixRequisicao requisicao)
    {
        var evento = await BuscarPorSlugAsync(slug);
        if (evento is null)
            return EventoNaoEncontrado<PixResposta>();

        if (evento.ChavePix is null || evento.NomeRecebedorPix is null || evento.CidadePix is null)
            return Resultado<PixResposta>.Falha(TipoErro.NaoEncontrado, "Este evento não recebe presentes via Pix.");

        if (requisicao.Valor is decimal valor && (valor <= 0 || valor > ValorMaximoPix || decimal.Round(valor, 2) != valor))
            return Resultado<PixResposta>.Invalido(new()
            {
                ["valor"] = [$"Informe um valor entre R$ 0,01 e R$ {ValorMaximoPix:N0}, com no máximo 2 casas decimais."],
            });

        var copiaECola = GeradorPix.GerarCopiaECola(evento.ChavePix, evento.NomeRecebedorPix, evento.CidadePix, requisicao.Valor);
        return Resultado<PixResposta>.Ok(new PixResposta(
            copiaECola,
            GeradorPix.GerarQrCode(copiaECola),
            requisicao.Valor,
            evento.NomeRecebedorPix));
    }

    /// <summary>Confere o código de reserva e aplica a alteração. A alteração devolve uma mensagem se não for permitida.</summary>
    private async Task<Resultado<ItemPresente>> AlterarReservaAsync(
        string slug, int presenteId, string? codigoReserva, Func<ItemPresente, string?> alterar)
    {
        var evento = await BuscarPorSlugAsync(slug);
        if (evento is null)
            return EventoNaoEncontrado<ItemPresente>();

        var presente = await banco.ItensPresente.FirstOrDefaultAsync(p => p.Id == presenteId && p.EventoId == evento.Id);
        if (presente is null)
            return PresenteNaoEncontrado<ItemPresente>();

        if (presente.CodigoReserva is null || !CodigosIguais(presente.CodigoReserva, codigoReserva))
            return Resultado<ItemPresente>.Falha(
                TipoErro.Conflito, "Sua reserva deste presente não foi encontrada. Ela pode ter sido cancelada pelo organizador.");

        if (alterar(presente) is string mensagem)
            return Resultado<ItemPresente>.Falha(TipoErro.Conflito, mensagem);

        await banco.SaveChangesAsync();
        return Resultado<ItemPresente>.Ok(presente);
    }

    private async Task<Convidado> BuscarOuCriarConvidadoAsync(int eventoId, string nome)
    {
        var nomeMinusculo = nome.ToLower();
        var convidado = await banco.Convidados
            .Where(c => c.EventoId == eventoId && c.Nome.ToLower() == nomeMinusculo)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync();

        if (convidado is null)
        {
            convidado = new Convidado { EventoId = eventoId, Nome = nome };
            banco.Convidados.Add(convidado);
        }

        return convidado;
    }

    private Task<Evento?> BuscarPorSlugAsync(string slug)
    {
        var slugNormalizado = (slug ?? string.Empty).Trim().ToLowerInvariant();
        return banco.Eventos.FirstOrDefaultAsync(e => e.SlugPublico == slugNormalizado);
    }

    // Comparação em tempo constante, para o tempo de resposta não revelar pedaços do código
    private static bool CodigosIguais(string esperado, string? recebido) =>
        recebido is not null &&
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(esperado), Encoding.UTF8.GetBytes(recebido.Trim()));

    private static Resultado<T> EventoNaoEncontrado<T>() =>
        Resultado<T>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado. Confira o link do convite.");

    private static Resultado<T> PresenteNaoEncontrado<T>() =>
        Resultado<T>.Falha(TipoErro.NaoEncontrado, "Presente não encontrado.");

    private static Resultado<T> PresenteIndisponivel<T>() =>
        Resultado<T>.Falha(TipoErro.Conflito, "Este presente acabou de ser reservado por outra pessoa. Escolha outro!");
}
