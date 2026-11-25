import { useCallback, useEffect, useState } from 'react'
import calendario from '../assets/calendar.svg'
import imagemCapa from '../assets/event-hero.png'
import olhoAtivo from '../assets/eye-active.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { urlApi } from '../api/cliente'
import { obterEvento } from '../api/eventos'
import { listarFormandosPublicos, listarFotosPublicas, listarPresentesPublicos, obterEventoPublico } from '../api/publico'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraLateral } from '../componentes/BarraLateral'
import { Icone } from '../componentes/Icone'
import { CartaoPix } from '../componentes/CartaoPix'
import { ContagemRegressiva } from '../componentes/ContagemRegressiva'
import { EnvioFotosMural } from '../componentes/EnvioFotosMural'
import { FormularioPresenca } from '../componentes/FormularioPresenca'
import { ListaPresentesPublica } from '../componentes/ListaPresentesPublica'
import { MensagemLista } from '../componentes/MensagemLista'
import { NavegacaoInferior, type ItemNavegacao } from '../componentes/NavegacaoInferior'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { VisualizadorFotos } from '../componentes/VisualizadorFotos'
import { formatarDataPorExtenso, rotulosTipoEvento, tempoRestante } from '../dados/formatacao'
import { linkPaginaFormando, linkPublicoEvento, linkRecapitulacao } from '../dados/rotas'
import { estiloTemaEvento } from '../dados/coresTema'
import { useAgora } from '../hooks/useAgora'
import { useCarregamento } from '../hooks/useCarregamento'

const titulo = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'
/** Container centralizado de cada seção. */
const envoltorio = 'mx-auto w-full max-w-5xl px-6 lg:px-10'
/** Linha de 2 colunas no desktop. */
const duasColunas = `${envoltorio} lg:grid lg:grid-cols-2 lg:gap-10`

const FOTOS_INICIAIS = 12

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
  // Na formatura, os formandos vêm junto para a página linkar a sub-página de cada um
  const carregar = useCallback(
    () =>
      Promise.all([
        obterEventoPublico(slug),
        listarPresentesPublicos(slug),
        listarFotosPublicas(slug),
        listarFormandosPublicos(slug),
      ]),
    [slug],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const agora = useAgora()

  const [todasFotos, setTodasFotos] = useState(false)
  // Foto do mural aberta no visualizador (índice em `fotos`); null = fechado
  const [fotoAberta, setFotoAberta] = useState<number | null>(null)
  const fecharFoto = useCallback(() => setFotoAberta(null), [])

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

  const [evento, presentes, fotos, formandos] = dados
  const formatura = evento.tipo === 'Formatura'
  const dataPorExtenso = formatarDataPorExtenso(evento.dataEvento)
  const eventoJaComecou = new Date(evento.dataEvento).getTime() <= agora
  const fotosVisiveis = todasFotos ? fotos : fotos.slice(0, FOTOS_INICIAIS)

  // A cor escolhida nas configurações substitui todos os tons de roxo do tema nesta página
  const estiloTema = estiloTemaEvento(evento.corPrincipal)

  // Aviso no lugar de uma seção desativada (só o organizador vê, na pré-visualização)
  const avisoSecaoDesativada = (secao: string) => (
    <p className="mt-5 rounded-[12px] border-[1.5px] border-dashed border-field-border p-5 text-[13px] text-muted lg:text-center">
      {secao} está desativado nas Configurações, então os convidados não veem esta seção.
    </p>
  )

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
              <img
                src={evento.bannerUrl ? urlApi(evento.bannerUrl) : imagemCapa}
                alt=""
                className="size-full object-cover"
              />
              {/* Degradê só na parte de baixo: a foto fica viva em cima e o texto sempre tem contraste */}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/80 via-black/35 to-transparent" />

              {/* Tipo, nome e data juntos, logo acima do timer */}
              <div className="absolute inset-x-6 bottom-6 flex flex-col gap-4 lg:inset-x-8 lg:bottom-8">
                <div className="flex flex-col items-start gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold tracking-[1.8px] text-white uppercase lg:text-[11px]">
                    {rotulosTipoEvento[evento.tipo]}
                  </span>
                  <h1 className="font-heading text-[34px] leading-tight font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] lg:text-[44px]">
                    {evento.nomeEvento}
                  </h1>
                  <p className="text-[13px] font-medium text-white/85 lg:text-[15px]">{dataPorExtenso}</p>
                </div>
                <div className="lg:max-w-xs">
                  {eventoJaComecou ? (
                    <a
                      href={linkRecapitulacao(slug)}
                      className="block rounded-[12px] bg-white/25 px-2 py-3 text-center text-[15px] font-bold text-white backdrop-blur-sm hover:bg-white/35"
                    >
                      O grande dia chegou! Ver a recapitulação
                    </a>
                  ) : (
                    <ContagemRegressiva unidades={tempoRestante(evento.dataEvento, agora)} />
                  )}
                </div>
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
                <Icone src={calendario} className="text-heading" />
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

        {/* Formatura: cada formando tem a sua sub-página, com a lista de presentes pessoal */}
        {formatura && (
          <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
            <div className={envoltorio}>
              <RotuloSecao className="text-center">FORMANDOS</RotuloSecao>
              <h2 className={`mt-4 ${titulo} lg:text-center`}>Presenteie um formando</h2>
              <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
                Cada formando tem a sua página, com a lista de presentes e um recado.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-4">
                {formandos.length === 0 && <MensagemLista>A turma ainda não tem formandos cadastrados.</MensagemLista>}
                {formandos.map((f) => (
                  <a
                    key={f.slug}
                    href={linkPaginaFormando(slug, f.slug)}
                    className="flex items-center justify-between gap-2 rounded-[12px] bg-surface p-4 text-[14px] font-bold text-heading shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)] transition-colors hover:text-primary"
                  >
                    <span className="min-w-0 truncate">{f.nome}</span>
                    <span className="shrink-0 text-[12px] font-medium text-primary">Ver página</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Presentes do evento (faixa, grade 3 colunas). Na formatura, aparece só se tiver presentes */}
        {(evento.listaPresentesAtiva || preVisualizacao) && (!formatura || presentes.length > 0) && (
          <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
            <div className={envoltorio}>
              <RotuloSecao className="text-center">PRESENTES</RotuloSecao>
              <h2 className={`mt-4 ${titulo} lg:text-center`}>Lista de presentes</h2>
              {!evento.listaPresentesAtiva && avisoSecaoDesativada('A lista de presentes')}
              <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
                Reserve um item para ninguém dar o mesmo presente.
              </p>
              <ListaPresentesPublica
                slug={slug}
                presentes={presentes}
                somenteLeitura={preVisualizacao}
                onAlterado={recarregar}
              />
            </div>
          </section>
        )}

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
                  <CartaoPix slug={slug} nomeRecebedor={evento.nomeRecebedorPix} somenteLeitura={preVisualizacao} />
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
        {(evento.muralAtivo || preVisualizacao) && (
          <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
            <div className={envoltorio}>
              <RotuloSecao className="lg:text-center">MURAL</RotuloSecao>
              <h2 className={`mt-4 ${titulo} lg:text-center`}>Fotos da festa</h2>
              {!evento.muralAtivo && avisoSecaoDesativada('O mural de fotos')}
              <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
                Suas fotos aparecem aqui depois de aprovadas.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-8 lg:grid-cols-6 lg:gap-4">
                {fotos.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-[10px] ${i % 2 === 0 ? 'bg-surface' : 'bg-primary-soft'}`}
                      />
                    ))
                  : fotosVisiveis.map((f, i) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFotoAberta(i)}
                        className="aspect-square cursor-zoom-in overflow-hidden rounded-[10px] bg-surface"
                        title={f.nomeAutor ? `Enviada por ${f.nomeAutor}` : undefined}
                      >
                        <img src={urlApi(f.url)} alt={f.nomeAutor ? `Foto de ${f.nomeAutor}` : 'Foto do mural'} loading="lazy" className="size-full object-cover" />
                      </button>
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
              {/* As setas passam por todas as fotos aprovadas, mesmo as que ainda não aparecem na grade */}
              <VisualizadorFotos fotos={fotos} indice={fotoAberta} onTrocar={setFotoAberta} onFechar={fecharFoto} />
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="bg-primary-strong py-9 text-center lg:py-14">
          <p className="text-[14px] font-bold text-white lg:text-[18px]">{evento.nomeEvento}</p>
          <p className="mt-1 text-[12px] text-primary-soft lg:text-[14px]">{dataPorExtenso}</p>
          <p className="mt-4 text-[11px] text-primary-soft">
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
  onAbrirConfiguracoes?: () => void
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
