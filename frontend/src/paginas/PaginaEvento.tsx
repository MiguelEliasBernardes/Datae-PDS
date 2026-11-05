import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import calendario from '../assets/calendar.svg'
import imagemCapa from '../assets/event-hero.png'
import olhoAtivo from '../assets/eye-active.svg'
import presenteBotao from '../assets/gift-btn.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { urlApi } from '../api/cliente'
import { obterEvento } from '../api/eventos'
import { listarFotosPublicas, listarPresentesPublicos, obterEventoPublico } from '../api/publico'
import type { PresentePublico, StatusPresente } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraLateral } from '../componentes/BarraLateral'
import { Botao } from '../componentes/Botao'
import { CartaoPix } from '../componentes/CartaoPix'
import { CartaoPresentePublico } from '../componentes/CartaoPresentePublico'
import { ContagemRegressiva } from '../componentes/ContagemRegressiva'
import { EnvioFotosMural } from '../componentes/EnvioFotosMural'
import { FormularioPresenca } from '../componentes/FormularioPresenca'
import { FormularioReserva } from '../componentes/FormularioReserva'
import { JanelaModal } from '../componentes/JanelaModal'
import { MensagemLista } from '../componentes/MensagemLista'
import { NavegacaoInferior, type ItemNavegacao } from '../componentes/NavegacaoInferior'
import { RotuloSecao } from '../componentes/RotuloSecao'
import type { TomSelo } from '../componentes/SeloStatus'
import {
  formatarDataPorExtenso,
  formatarMoeda,
  rotulosStatusPresente,
  rotulosTipoEvento,
  tempoRestante,
} from '../dados/formatacao'
import { codigoReserva } from '../dados/reservas'
import { linkPublicoEvento } from '../dados/rotas'
import { useAgora } from '../hooks/useAgora'
import { useCarregamento } from '../hooks/useCarregamento'

const titulo = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'
/** Container centralizado de cada seção. */
const envoltorio = 'mx-auto w-full max-w-5xl px-6 lg:px-10'
/** Linha de 2 colunas no desktop. */
const duasColunas = `${envoltorio} lg:grid lg:grid-cols-2 lg:gap-10`

const PRESENTES_INICIAIS = 3
const FOTOS_INICIAIS = 12

const tomStatusPresente: Record<StatusPresente, TomSelo> = {
  Disponivel: 'sucesso',
  Reservado: 'neutro',
  Comprado: 'destaque',
}

/**
 * Tela G1 - Página pública do Evento, aberta pelos convidados em /e/{slug} (sem login).
 * O organizador vê a mesma página na pré-visualização, com a navegação do painel
 * e os formulários desativados.
 */
export function PaginaEvento({
  slug,
  navegacao,
  preVisualizacao = false,
}: {
  slug: string
  navegacao?: ItemNavegacao[]
  preVisualizacao?: boolean
}) {
  const carregar = useCallback(
    () => Promise.all([obterEventoPublico(slug), listarPresentesPublicos(slug), listarFotosPublicas(slug)]),
    [slug],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const agora = useAgora()

  const [presenteAberto, setPresenteAberto] = useState<PresentePublico | null>(null)
  const [avisoPresentes, setAvisoPresentes] = useState<string | null>(null)
  const [todosPresentes, setTodosPresentes] = useState(false)
  const [todasFotos, setTodasFotos] = useState(false)
  const fecharPresente = useCallback(() => setPresenteAberto(null), [])

  const nomeEvento = dados?.[0].nomeEvento
  useEffect(() => {
    if (nomeEvento && !preVisualizacao) document.title = `${nomeEvento} · Dataê`
  }, [nomeEvento, preVisualizacao])

  if (!dados) {
    return (
      <div className="flex min-h-screen w-full bg-page">
        {navegacao && <BarraLateral itens={navegacao} />}
        <main className="flex min-h-screen w-full flex-1 flex-col px-6 pt-10 pb-6">
          <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
          {carregando && <MensagemLista>Carregando página...</MensagemLista>}
          {navegacao && <NavegacaoInferior className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden" itens={navegacao} />}
        </main>
      </div>
    )
  }

  const [evento, presentesDaApi, fotos] = dados
  // As reservas feitas neste aparelho vêm primeiro, para o convidado achar "Minha reserva" sem procurar.
  // O resto mantém a ordem da API (disponíveis antes dos reservados).
  const presentes = [...presentesDaApi].sort(
    (a, b) => Number(codigoReserva(b.id) !== null) - Number(codigoReserva(a.id) !== null),
  )
  const dataPorExtenso = formatarDataPorExtenso(evento.dataEvento)
  const eventoJaComecou = new Date(evento.dataEvento).getTime() <= agora
  const presentesVisiveis = todosPresentes ? presentes : presentes.slice(0, PRESENTES_INICIAIS)
  const fotosVisiveis = todasFotos ? fotos : fotos.slice(0, FOTOS_INICIAIS)

  // A cor escolhida nas configurações substitui o roxo padrão nesta página
  const estiloTema = evento.corPrincipal
    ? ({ '--color-primary': evento.corPrincipal } as CSSProperties)
    : undefined

  function acaoDoPresente(p: PresentePublico) {
    if (p.status === 'Disponivel') return 'Reservar'
    if (codigoReserva(p.id)) return 'Minha reserva'
    return undefined
  }

  return (
    <div className="flex min-h-screen w-full bg-page" style={estiloTema}>
      {navegacao && <BarraLateral itens={navegacao} />}

      <main className="relative min-h-screen w-full flex-1 pb-6">
        {preVisualizacao && (
          <div className={`${envoltorio} pt-6`}>
            <p className="rounded-[10px] bg-badge px-4 py-3 text-[12px] text-heading lg:text-[13px]">
              <strong>Pré-visualização:</strong> é assim que seus convidados veem a página. Aqui os formulários
              ficam desativados; para testar, abra o{' '}
              <a href={linkPublicoEvento(slug)} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                link público
              </a>
              .
            </p>
          </div>
        )}

        {/* Capa + Convite (2 colunas no desktop) */}
        <section className="pt-8 lg:pt-14">
          <div className={`${duasColunas} lg:items-center`}>
            {/* Imagem do evento */}
            <div className="relative aspect-[338/507] overflow-hidden rounded-[10px] lg:aspect-[3/4] lg:rounded-[24px]">
              <img src={imagemCapa} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[1.8px] text-white uppercase lg:top-6 lg:right-6 lg:text-[12px]">
                {rotulosTipoEvento[evento.tipo]}
              </span>
              <h1 className="absolute top-8 left-3 max-w-[85%] font-heading text-[34px] leading-tight font-bold text-primary [text-shadow:0px_2px_4px_rgba(255,255,255,0.3)] lg:top-12 lg:left-6 lg:text-[44px]">
                {evento.nomeEvento}
              </h1>
              <div className="absolute inset-x-6 bottom-6 lg:max-w-xs">
                {eventoJaComecou ? (
                  <p className="rounded-[12px] bg-white/25 px-2 py-3 text-center text-[15px] font-bold text-white backdrop-blur-sm">
                    O grande dia chegou!
                  </p>
                ) : (
                  <ContagemRegressiva unidades={tempoRestante(evento.dataEvento, agora)} />
                )}
              </div>
            </div>

            {/* Convite */}
            <div className="mt-8 lg:mt-0">
              <RotuloSecao className="text-center lg:text-left">
                O CONVITE
              </RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Vem comemorar com a gente</h2>
              <p className="mt-2 text-[13px] whitespace-pre-line text-muted lg:text-[15px]">
                {evento.descricao ?? 'Confirme presença, escolha um presente e traga a família.'}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <img src={calendario} alt="" width={24} height={24} />
                <span className="text-[14px] font-medium text-primary">{dataPorExtenso}</span>
              </div>

              {/* Local */}
              {evento.local && (
                <div className="relative mt-6 rounded-[12px] bg-badge p-4 lg:p-5">
                  <RotuloSecao className="tracking-[1.4px]">LOCAL</RotuloSecao>
                  <p className="mt-1 pr-16 text-[13px] font-medium text-heading">{evento.local}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.local)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-4 right-4 text-[12px] font-medium text-primary"
                  >
                    Ver mapa
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Presença (introdução | formulário) */}
        <section className="pt-10 lg:pt-16">
          <div className={`${duasColunas} lg:items-start`}>
            <div>
              <RotuloSecao className="text-center lg:text-left">
                PRESENÇA
              </RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Você vai?</h2>
              <p className="mt-1 text-[12px] text-muted lg:text-[14px]">
                Confirme para ajudar na organização.
              </p>
            </div>

            <div className="mt-4 lg:mt-0">
              <FormularioPresenca slug={slug} somenteLeitura={preVisualizacao} />
            </div>
          </div>
        </section>

        {/* Presentes (faixa, grade 3 colunas) */}
        <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
          <div className={envoltorio}>
            <RotuloSecao className="text-center">PRESENTES</RotuloSecao>
            <h2 className={`mt-4 ${titulo} lg:text-center`}>Lista de presentes</h2>
            <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
              Reserve um item para ninguém dar o mesmo presente.
            </p>
            {avisoPresentes && (
              <p role="status" className="mt-4 rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success lg:text-center">
                {avisoPresentes}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-6">
              {presentes.length === 0 && <MensagemLista>Nenhum presente cadastrado ainda.</MensagemLista>}
              {presentesVisiveis.map((p) => (
                <CartaoPresentePublico
                  key={p.id}
                  nome={p.nome}
                  preco={formatarMoeda(p.valorEstimado)}
                  imagem={p.foto ?? undefined}
                  link={p.linkAfiliado ?? undefined}
                  status={{ rotulo: rotulosStatusPresente[p.status], tom: tomStatusPresente[p.status] }}
                  acao={acaoDoPresente(p)}
                  onAcao={() => setPresenteAberto(p)}
                />
              ))}
            </div>
            {presentes.length > PRESENTES_INICIAIS && (
              <Botao
                className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
                onClick={() => setTodosPresentes((atual) => !atual)}
                icone={<img src={presenteBotao} alt="" width={24} height={24} />}
              >
                {todosPresentes ? 'Mostrar menos' : `Todos presentes (${presentes.length})`}
              </Botao>
            )}
          </div>
        </section>

        {/* Presente em dinheiro / Pix (introdução | card) */}
        {(evento.pixDisponivel || preVisualizacao) && (
          <section className="pt-10 lg:pt-16">
            <div className={`${duasColunas} lg:items-center`}>
              <div>
                <RotuloSecao className="text-center lg:text-left">
                  PRESENTE EM DINHEIRO
                </RotuloSecao>
                <h2 className={`mt-4 ${titulo}`}>Prefere ajudar com Pix?</h2>
                <p className="mt-2 hidden text-[14px] text-muted lg:block">
                  Contribua com qualquer valor e gere um QR Code na hora.
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                {evento.pixDisponivel ? (
                  <CartaoPix slug={slug} nomeRecebedor={evento.nomeRecebedorPix} />
                ) : (
                  // Só aparece para o organizador: convidados não veem a seção sem Pix configurado
                  <p className="rounded-[12px] border-[1.5px] border-dashed border-field-border p-5 text-[13px] text-muted">
                    Esta seção fica escondida dos convidados até você cadastrar uma chave Pix em Configurações.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Mural de fotos */}
        <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
          <div className={envoltorio}>
            <RotuloSecao className="lg:text-center">MURAL</RotuloSecao>
            <h2 className={`mt-4 ${titulo} lg:text-center`}>Fotos da festa</h2>
            <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
              Suas fotos aparecem aqui depois de aprovadas.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-8 lg:grid-cols-6 lg:gap-4">
              {fotos.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-[10px] ${i % 2 === 0 ? 'bg-surface' : 'bg-theme-lilac'}`}
                    />
                  ))
                : fotosVisiveis.map((f) => (
                    <a
                      key={f.id}
                      href={urlApi(f.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square overflow-hidden rounded-[10px] bg-surface"
                      title={f.nomeAutor ? `Enviada por ${f.nomeAutor}` : undefined}
                    >
                      <img src={urlApi(f.url)} alt={f.nomeAutor ? `Foto de ${f.nomeAutor}` : 'Foto do mural'} loading="lazy" className="size-full object-cover" />
                    </a>
                  ))}
            </div>
            {fotos.length === 0 && (
              <p className="mt-3 text-center text-[12px] text-muted">Ainda não há fotos. Seja o primeiro a enviar!</p>
            )}
            {fotos.length > FOTOS_INICIAIS && (
              <button
                type="button"
                onClick={() => setTodasFotos((atual) => !atual)}
                className="mt-4 block w-full text-center text-[13px] font-medium text-primary underline"
              >
                {todasFotos ? 'Mostrar menos fotos' : `Ver todas as ${fotos.length} fotos`}
              </button>
            )}
            <EnvioFotosMural slug={slug} somenteLeitura={preVisualizacao} />
          </div>
        </section>

        {/* Rodapé */}
        <footer className="bg-primary-strong py-9 text-center lg:py-14">
          <p className="text-[14px] font-bold text-white lg:text-[18px]">{evento.nomeEvento}</p>
          <p className="mt-1 text-[12px] text-theme-lilac lg:text-[14px]">{dataPorExtenso}</p>
          <p className="mt-4 text-[11px] text-theme-lilac">
            Página criada com Dataê
          </p>
        </footer>

        {/* Navegação flutuante (só mobile; no desktop usa-se a barra lateral) */}
        {navegacao && (
          <NavegacaoInferior
            className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden"
            itens={navegacao}
          />
        )}
      </main>

      <JanelaModal titulo={presenteAberto?.nome ?? ''} aberta={presenteAberto !== null} onFechar={fecharPresente}>
        {presenteAberto && (
          <FormularioReserva
            // key recria o formulário ao trocar de presente
            key={presenteAberto.id}
            slug={slug}
            presente={presenteAberto}
            codigo={codigoReserva(presenteAberto.id)}
            somenteLeitura={preVisualizacao}
            onConcluido={(mensagem) => {
              setPresenteAberto(null)
              setAvisoPresentes(mensagem)
              recarregar()
            }}
          />
        )}
      </JanelaModal>
    </div>
  )
}

/** Pré-visualização da página pública dentro do painel do organizador. */
export function PreVisualizacaoEvento({
  eventoId,
  onVoltar,
  onAbrirConfiguracoes,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirConfiguracoes: () => void
}) {
  const carregar = useCallback(() => obterEvento(eventoId), [eventoId])
  const { dados: evento, erro, carregando, recarregar } = useCarregamento(carregar)

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olhoAtivo, rotulo: 'Visualizar', ativo: true },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  if (evento) return <PaginaEvento slug={evento.slugPublico} navegacao={navegacao} preVisualizacao />

  return (
    <div className="flex min-h-screen w-full bg-page">
      <BarraLateral itens={navegacao} />
      <main className="flex min-h-screen w-full flex-1 flex-col px-6 pt-10 pb-6">
        <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando página...</MensagemLista>}
        <NavegacaoInferior className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden" itens={navegacao} />
      </main>
    </div>
  )
}
