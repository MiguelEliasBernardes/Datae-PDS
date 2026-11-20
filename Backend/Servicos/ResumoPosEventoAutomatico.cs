using Backend.Dados;
using Microsoft.EntityFrameworkCore;

namespace Backend.Servicos;

/// <summary>
/// Tarefa em segundo plano que manda o resumo do pós-evento ao dono, por e-mail, um dia depois do evento.
/// Roda a cada hora e só age se o e-mail estiver configurado. Cada evento recebe o resumo uma vez só:
/// o evento é "reservado" com um UPDATE condicionado em ResumoEnviadoEm, então dois servidores não mandam em dobro.
/// Eventos que terminaram há mais de 30 dias são ignorados (não manda resumo atrasado de evento antigo).
/// </summary>
public class ResumoPosEventoAutomatico(IServiceScopeFactory escopos, ServicoEmail servicoEmail, ILogger<ResumoPosEventoAutomatico> logger)
    : BackgroundService
{
    private static readonly TimeSpan Intervalo = TimeSpan.FromHours(1);
    private static readonly TimeSpan EsperaDepoisDoEvento = TimeSpan.FromDays(1);
    private static readonly TimeSpan IdadeMaxima = TimeSpan.FromDays(30);

    protected override async Task ExecuteAsync(CancellationToken cancelamento)
    {
        if (!servicoEmail.Configurado)
            return;

        // Espera um pouco depois de subir, para não competir com a inicialização
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(1), cancelamento);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        using var relogio = new PeriodicTimer(Intervalo);
        do
        {
            try
            {
                await EnviarPendentesAsync(cancelamento);
            }
            catch (Exception erro) when (erro is not OperationCanceledException)
            {
                logger.LogError(erro, "Falha ao enviar os resumos do pós-evento");
            }
        }
        while (await relogio.WaitForNextTickAsync(cancelamento));
    }

    private async Task EnviarPendentesAsync(CancellationToken cancelamento)
    {
        using var escopo = escopos.CreateScope();
        var banco = escopo.ServiceProvider.GetRequiredService<ContextoBanco>();
        var servico = escopo.ServiceProvider.GetRequiredService<ServicoPosEvento>();

        var agora = DateTime.UtcNow;
        var limite = agora - EsperaDepoisDoEvento;
        var maisAntigo = agora - IdadeMaxima;
        var eventos = await banco.Eventos.AsNoTracking()
            .Where(e => e.ResumoEnviadoEm == null && e.DataEvento <= limite && e.DataEvento >= maisAntigo)
            .ToListAsync(cancelamento);

        foreach (var evento in eventos)
        {
            var reservado = await banco.Eventos
                .Where(e => e.Id == evento.Id && e.ResumoEnviadoEm == null)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.ResumoEnviadoEm, agora), cancelamento);
            if (reservado == 0)
                continue;

            try
            {
                await servico.EnviarResumoAutomaticoAsync(evento, cancelamento);
                logger.LogInformation("Resumo do pós-evento enviado para o dono do evento {EventoId}", evento.Id);
            }
            catch (Exception erro) when (erro is not OperationCanceledException)
            {
                // Libera o evento para tentar de novo na próxima rodada
                logger.LogWarning(erro, "Falha ao enviar o resumo do evento {EventoId}", evento.Id);
                await banco.Eventos
                    .Where(e => e.Id == evento.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(e => e.ResumoEnviadoEm, (DateTime?)null), CancellationToken.None);
            }
        }
    }
}
