import { useCallback, useState } from 'react'
import notaDinheiro from '../assets/banknote-stat.svg'
import olho from '../assets/eye.svg'
import presenteIcone from '../assets/gift-stat.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import pessoas from '../assets/users.svg'
import { mensagemDeErro } from '../api/cliente'
import { atualizarEvento } from '../api/eventos'
import { enviarAgradecimentosEmail, enviarResumoPorEmail, obterResumoPosEvento, registrarWhatsApp } from '../api/posEvento'
import type { ResumoPosEvento } from '../api/tipos'
import { AreaTexto } from '../componentes/AreaTexto'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraProgresso } from '../componentes/BarraProgresso'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CarrosselEstatisticas } from '../componentes/CarrosselEstatisticas'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaAgradecimento } from '../componentes/LinhaAgradecimento'
import { MensagemLista } from '../componentes/MensagemLista'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { SeloStatus } from '../componentes/SeloStatus'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarDataPorExtenso, formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

const secao = 'mt-8 flex flex-col gap-3 lg:max-w-4xl'

/**
 * Tela do pós-evento, para quem gerencia o evento:
 * - resumo do que foi arrecadado (presentes inteiros e cotas, com quem deu cada um) e da presença;
 * - agradecimento aos convidados por WhatsApp (link com a mensagem pronta) ou e-mail;
 * - link da página de recapitulação, que os convidados recebem no agradecimento.
 */
export function PosEvento({
  eventoId,
  onVoltar,
  onAbrirRecapitulacao,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirRecapitulacao: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterResumoPosEvento(eventoId), [eventoId])
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  // O envio de e-mails devolve o resumo atualizado, que substitui o carregado
  const [atualizado, setAtualizado] = useState<ResumoPosEvento | null>(null)
  const resumo = atualizado ?? dados

  const [mensagem, setMensagem] = useState<string | null>(null)
  const [salvandoMensagem, setSalvandoMensagem] = useState(false)
  const [enviando, setEnviando] = useState<number | 'todos' | 'resumo' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  async function executar(chave: NonNullable<typeof enviando>, acao: () => Promise<string>) {
    setErroAcao(null)
    setAviso(null)
    setEnviando(chave)
    try {
      setAviso(await acao())
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setEnviando(null)
    }
  }

  async function salvarMensagem() {
    setErroAcao(null)
    setAviso(null)
    setSalvandoMensagem(true)
    try {
      await atualizarEvento(eventoId, { mensagemAgradecimento: mensagem ?? '' })
      setAtualizado(null)
      setMensagem(null)
      recarregar()
      setAviso('Mensagem salva. Os agradecimentos e a recapitulação já usam o texto novo.')
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setSalvandoMensagem(false)
    }
  }

  const enviarEmails = (ids?: number[]) =>
    executar(ids ? ids[0] : 'todos', async () => {
      const envio = await enviarAgradecimentosEmail(eventoId, ids, ids !== undefined)
      setAtualizado(envio.resumo)
      const falhas = envio.falhas > 0 ? ` ${envio.falhas} não puderam ser enviados; tente de novo mais tarde.` : ''
      return envio.enviados === 0
        ? `Nenhum e-mail para enviar.${falhas}`
        : `${envio.enviados === 1 ? '1 e-mail enviado' : `${envio.enviados} e-mails enviados`}.${falhas}`
    })

  function abrirWhatsApp(convidadoId: number) {
    // O WhatsApp abre numa nova aba pelo próprio link; aqui só fica registrado para marcar na lista
    if (!resumo) return
    setAtualizado({
      ...resumo,
      agradecimentos: resumo.agradecimentos.map((a) =>
        a.convidadoId === convidadoId ? { ...a, whatsAppAbertoEm: new Date().toISOString() } : a,
      ),
    })
    registrarWhatsApp(eventoId, convidadoId).catch(() => undefined)
  }

  if (!resumo) {
    return (
      <LayoutPainel itens={navegacao}>
        <BotaoVoltar onVoltar={onVoltar} />
        <TituloDestaque>Pós-evento</TituloDestaque>
        <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando resumo...</MensagemLista>}
      </LayoutPainel>
    )
  }

  const pendentesEmail = resumo.agradecimentos.filter((a) => a.email && !a.emailEnviadoEm).length
  const comContato = resumo.agradecimentos.filter((a) => a.telefone || a.email).length
  const semContato = resumo.agradecimentos.length - comContato
  const textoMensagem = mensagem ?? resumo.mensagemAgradecimento ?? ''

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />
      <TituloDestaque>Pós-evento</TituloDestaque>
      <p className="mt-2 font-display text-[12px] text-muted lg:text-[13px]">
        {resumo.nomeEvento} · {formatarDataPorExtenso(resumo.dataEvento)}
      </p>

      {!resumo.eventoRealizado && (
        <p className="mt-4 rounded-[10px] bg-badge px-4 py-3 text-[12px] text-heading lg:max-w-4xl lg:text-[13px]">
          O evento ainda não aconteceu: os números abaixo ainda podem mudar. A recapitulação fica aberta para os
          convidados a partir da data do evento.
        </p>
      )}

      <AvisoErro className="mt-4 lg:max-w-4xl" mensagem={erroAcao} />
      {aviso && (
        <p role="status" className="mt-4 rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success lg:max-w-4xl">
          {aviso}
        </p>
      )}

      {/* Arrecadação */}
      <section className={secao}>
        <RotuloSecao>ARRECADAÇÃO</RotuloSecao>
        <div className="rounded-[16px] bg-primary-strong p-5 text-white lg:p-6">
          <p className="text-[13px] text-primary-soft">Total arrecadado (estimado)</p>
          <p className="mt-1 font-heading text-[32px] leading-tight font-bold lg:text-[40px]">
            {formatarMoeda(resumo.totalArrecadado)}
          </p>
          <p className="mt-2 text-[12px] text-primary-soft">
            Presentes: {formatarMoeda(resumo.valorPresentes)} · Cotas: {formatarMoeda(resumo.valorCotas)}
            {resumo.pix.length > 0 && ` · Pix: ${formatarMoeda(resumo.valorPix)}`}
          </p>
        </div>
        <CarrosselEstatisticas>
          <CartaoEstatistica
            icone={presenteIcone}
            tom="menta"
            rotulo="Presentes recebidos"
            valor={`${resumo.presentesComprados + resumo.presentesReservados}`}
          />
          <CartaoEstatistica icone={notaDinheiro} tom="pessego" rotulo="Cotas vendidas" valor={`${resumo.cotasVendidas}`} />
          <CartaoEstatistica
            icone={pessoas}
            rotulo="Confirmados"
            valor={`${resumo.confirmados}${resumo.acompanhantes > 0 ? ` +${resumo.acompanhantes}` : ''}`}
          />
        </CarrosselEstatisticas>
        <p className="text-[12px] text-muted">
          {resumo.presenteadores === 1 ? '1 pessoa deu presente' : `${resumo.presenteadores} pessoas deram presente`} ·{' '}
          {resumo.recusados} não puderam ir · {resumo.pendentes} sem resposta · {resumo.fotosAprovadas} fotos no mural.
          Os valores são estimados pela lista de presentes: confira os depósitos do Pix no extrato do banco.
        </p>
        <div className="flex flex-col gap-2 lg:max-w-sm">
          <Botao
            variante="secundario"
            tamanho="pequeno"
            disabled={!resumo.emailDisponivel}
            carregando={enviando === 'resumo'}
            onClick={() =>
              void executar('resumo', async () => {
                const { email } = await enviarResumoPorEmail(eventoId)
                return `Resumo enviado para ${email}.`
              })
            }
          >
            Enviar este resumo para o meu e-mail
          </Botao>
          {resumo.emailDisponivel && (
            <p className="text-[11px] text-muted">
              {resumo.resumoEnviadoEm
                ? 'O resumo automático já foi enviado ao dono do evento.'
                : 'O dono do evento também recebe este resumo por e-mail, sozinho, um dia depois do evento.'}
            </p>
          )}
        </div>
      </section>

      {/* Presentes inteiros */}
      <section className={secao}>
        <RotuloSecao>PRESENTES RECEBIDOS</RotuloSecao>
        {resumo.presentes.length === 0 ? (
          <MensagemLista>Nenhum presente foi reservado ainda.</MensagemLista>
        ) : (
          <ul className="flex flex-col gap-2">
            {resumo.presentes.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-badge px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-heading">{p.nome}</p>
                  <p className="text-[12px] text-muted">
                    {p.nomeConvidado ? `De ${p.nomeConvidado}` : 'Convidado removido da lista'}
                    {p.nomeFormando ? ` · lista de ${p.nomeFormando}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold text-heading">{p.valor !== null ? formatarMoeda(p.valor) : '—'}</span>
                  <SeloStatus tom={p.status === 'Comprado' ? 'sucesso' : 'destaque'}>
                    {p.status === 'Comprado' ? 'Comprado' : 'Reservado'}
                  </SeloStatus>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cotas */}
      {resumo.presentesComCotas.length > 0 && (
        <section className={secao}>
          <RotuloSecao>PRESENTES EM COTAS</RotuloSecao>
          <ul className="flex flex-col gap-3">
            {resumo.presentesComCotas.map((p) => (
              <li key={p.id} className="rounded-[12px] border-[1.5px] border-field-border p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-[14px] font-semibold text-heading">
                    {p.nome}
                    {p.nomeFormando && <span className="font-normal text-muted"> · lista de {p.nomeFormando}</span>}
                  </p>
                  <span className="shrink-0 text-[13px] font-semibold text-heading">{formatarMoeda(p.valorArrecadado)}</span>
                </div>
                <BarraProgresso className="mt-2" valor={(p.cotasVendidas / p.quantidadeCotas) * 100} />
                <p className="mt-1 text-[12px] text-muted">
                  {p.cotasVendidas} de {p.quantidadeCotas} cotas
                  {p.valorEstimado !== null ? ` · meta de ${formatarMoeda(p.valorEstimado)}` : ''}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[12px] text-heading">
                  {p.compras.map((c, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {c.nomeConvidado} · {c.quantidade === 1 ? '1 cota' : `${c.quantidade} cotas`}
                      </span>
                      <span className="shrink-0">{formatarMoeda(c.valor)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pix livres (presente em dinheiro) avisados pelos convidados; os das cotas já aparecem nas cotas */}
      {resumo.pix.length > 0 && (
        <section className={secao}>
          <RotuloSecao>PRESENTES EM PIX</RotuloSecao>
          <ul className="flex flex-col gap-2">
            {resumo.pix.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-[12px] bg-badge px-4 py-3">
                <p className="min-w-0 truncate text-[14px] font-semibold text-heading">{p.nomeConvidado}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold text-heading">{formatarMoeda(p.valor)}</span>
                  <SeloStatus tom={p.conferido ? 'sucesso' : 'destaque'}>
                    {p.conferido ? 'Conferido' : 'Aguardando conferência'}
                  </SeloStatus>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted">Confira os Pix no extrato e marque em Financeiro (Pix).</p>
        </section>
      )}

      {/* Agradecimentos */}
      <section className={`${secao} mb-24 lg:mb-0`}>
        <RotuloSecao>AGRADECIMENTOS</RotuloSecao>
        <p className="text-[13px] text-muted">
          A mensagem vai com o nome do convidado, os presentes que ele deu e o link da recapitulação.
        </p>
        <AreaTexto
          rotulo="Sua mensagem"
          placeholder={resumo.mensagemPadrao}
          maxLength={1000}
          value={textoMensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
        <div className="flex flex-col gap-2 lg:flex-row">
          <Botao
            tamanho="pequeno"
            className="lg:max-w-xs"
            disabled={mensagem === null}
            carregando={salvandoMensagem}
            onClick={() => void salvarMensagem()}
          >
            Salvar mensagem
          </Botao>
          <Botao tamanho="pequeno" variante="secundario" className="lg:max-w-xs" onClick={onAbrirRecapitulacao}>
            Ver recapitulação
          </Botao>
        </div>
        <CampoTexto
          rotulo="Link da recapitulação"
          tomRotulo="campo"
          name="link-recapitulacao"
          readOnly
          onFocus={(e) => e.target.select()}
          value={resumo.linkRecapitulacao}
        />

        {resumo.agradecimentos.length === 0 ? (
          <MensagemLista>Ninguém confirmou presença nem deu presente ainda.</MensagemLista>
        ) : (
          <>
            <p className="text-[13px] text-heading">
              {resumo.agradecimentos.length === 1
                ? '1 convidado para agradecer'
                : `${resumo.agradecimentos.length} convidados para agradecer`}
              {semContato > 0 && <span className="text-muted"> ({semContato} sem telefone nem e-mail)</span>}
            </p>
            {resumo.emailDisponivel ? (
              pendentesEmail > 0 && (
                <Botao className="lg:max-w-sm" carregando={enviando === 'todos'} onClick={() => void enviarEmails()}>
                  {pendentesEmail === 1 ? 'Enviar e-mail para 1 convidado' : `Enviar e-mail para ${pendentesEmail} convidados`}
                </Botao>
              )
            ) : (
              <p className="rounded-[10px] bg-badge px-4 py-3 text-[12px] text-heading">
                O envio de e-mail não está configurado no servidor. O WhatsApp funciona normalmente.
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {resumo.agradecimentos.map((a) => (
                <LinhaAgradecimento
                  key={a.convidadoId}
                  agradecimento={a}
                  emailDisponivel={resumo.emailDisponivel}
                  enviandoEmail={enviando === a.convidadoId}
                  onAbrirWhatsApp={() => abrirWhatsApp(a.convidadoId)}
                  onEnviarEmail={() => void enviarEmails([a.convidadoId])}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </LayoutPainel>
  )
}
