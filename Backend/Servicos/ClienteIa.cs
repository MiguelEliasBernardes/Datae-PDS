using System.Text.Json;
using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Models.Messages;

namespace Backend.Servicos;

/// <summary>
/// Chamada à IA (Claude, da Anthropic) pela seção "Ia" do appsettings: "ChaveApi" e "Modelo".
/// Sem chave, o assistente fica desligado (as rotas respondem 503).
///
/// Para gastar o mínimo, cada pedido é uma chamada só, com o modelo mais barato (Claude Haiku 5.5),
/// sem raciocínio estendido, com esforço baixo e com a resposta presa a um esquema JSON
/// (saída estruturada), o que evita texto sobrando e uma segunda chamada para corrigir o formato.
/// </summary>
public class ClienteIa(IConfiguration configuracao, ILogger<ClienteIa> registro)
{
    private const string ModeloPadrao = "claude-haiku-5-5";

    private readonly string? chave = Validacoes.TextoOpcional(configuracao["Ia:ChaveApi"]);
    private readonly string modelo = Validacoes.TextoOpcional(configuracao["Ia:Modelo"]) ?? ModeloPadrao;

    // O cliente HTTP é reaproveitado entre as chamadas (a classe é singleton)
    private AnthropicClient? cliente;

    public bool Configurado => chave is not null;

    /// <summary>
    /// Pede à IA um JSON no formato do esquema e devolve o texto dele, ou nulo se não deu certo
    /// (sem chave, falha de rede, limite da API, recusa ou resposta cortada). O motivo vai para o log.
    /// </summary>
    public async Task<string?> GerarJsonAsync(
        string instrucoes, string pedido, object esquema, int maximoTokens, CancellationToken cancelamento = default)
    {
        if (chave is null)
            return null;

        cliente ??= new AnthropicClient
        {
            ApiKey = chave,
            Timeout = TimeSpan.FromSeconds(60),
            MaxRetries = 1,
        };

        try
        {
            var resposta = await cliente.Messages.Create(new MessageCreateParams
            {
                Model = modelo,
                MaxTokens = maximoTokens,
                Thinking = new ThinkingConfigDisabled(),
                OutputConfig = new OutputConfig
                {
                    Effort = Effort.Low,
                    Format = new JsonOutputFormat { Schema = ParaEsquema(esquema) },
                },
                System = instrucoes,
                Messages = [new UserMessageParam { Content = pedido }],
            }, cancelamento);

            registro.LogInformation(
                "IA ({Modelo}): {Entrada} tokens de entrada, {Saida} de saída, parada: {Parada}",
                modelo, resposta.Usage.InputTokens, resposta.Usage.OutputTokens, resposta.StopReason);

            // Recusa ou resposta cortada pelo limite de tokens: o JSON não serve
            if (resposta.StopReason != "end_turn")
                return null;

            return string.Concat(resposta.Content.Select(b => b.Value).OfType<TextBlock>().Select(t => t.Text));
        }
        catch (AnthropicRateLimitException ex)
        {
            registro.LogWarning(ex, "IA: limite de uso da API atingido.");
        }
        catch (AnthropicUnauthorizedException ex)
        {
            registro.LogError(ex, "IA: chave da API inválida (Ia:ChaveApi).");
        }
        catch (AnthropicException ex)
        {
            registro.LogError(ex, "IA: a chamada falhou.");
        }
        catch (HttpRequestException ex)
        {
            registro.LogError(ex, "IA: falha de rede.");
        }
        catch (TaskCanceledException ex) when (!cancelamento.IsCancellationRequested)
        {
            registro.LogWarning(ex, "IA: a chamada demorou demais.");
        }

        return null;
    }

    /// <summary>Converte um objeto anônimo com o esquema JSON no formato que o SDK recebe.</summary>
    private static Dictionary<string, JsonElement> ParaEsquema(object esquema) =>
        JsonSerializer.SerializeToElement(esquema).EnumerateObject().ToDictionary(p => p.Name, p => p.Value.Clone());
}
