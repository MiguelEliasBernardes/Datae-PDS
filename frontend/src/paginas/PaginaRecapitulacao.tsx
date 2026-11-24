import { useCallback, useEffect, useState } from 'react'
import imagemCapa from '../assets/event-hero.png'
import { urlApi } from '../api/cliente'
import { obterRecapitulacaoPrevia } from '../api/posEvento'
import { obterRecapitulacao } from '../api/publico'
import { ApresentacaoFotos } from '../componentes/ApresentacaoFotos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraLateral } from '../componentes/BarraLateral'
import { MensagemLista } from '../componentes/MensagemLista'
import { NavegacaoInferior, type ItemNavegacao } from '../componentes/NavegacaoInferior'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { VisualizadorFotos } from '../componentes/VisualizadorFotos'
import { formatarDataPorExtenso, rotulosTipoEvento } from '../dados/formatacao'
import { linkPublicoEvento } from '../dados/rotas'
import { estiloTemaEvento } from '../dados/coresTema'
import { useCarregamento } from '../hooks/useCarregamento'

const envoltorio = 'mx-auto w-full max-w-5xl px-6 lg:px-10'
const titulo = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'

/**
 * Recapitulação do evento, aberta em /e/{slug}/recapitulacao depois da data do evento (sem login).
 * Mostra o agradecimento do organizador, alguns números da festa e as fotos aprovadas do mural.
 * Os convidados recebem o link no agradecimento por WhatsApp ou e-mail.
 * Com `eventoId`, é a pré-visualização do organizador (funciona antes da data também).
 */
export function PaginaRecapitulacao({
  slug,
  eventoId,
  navegacao,
}: {
  slug?: string
  eventoId?: number
  navegacao?: ItemNavegacao[]
}) {
  const carregar = useCallback(
    () => (eventoId !== undefined ? obterRecapitulacaoPrevia(eventoId) : obterRecapitulacao(slug ?? '')),
    [eventoId, slug],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const preVisualizacao = eventoId !== undefined
  // Foto da grade aberta no visualizador; null = fechado
  const [fotoAberta, setFotoAberta] = useState<number | null>(null)
  const fecharFoto = useCallback(() => setFotoAberta(null), [])

  const nomeEvento = dados?.evento.nomeEvento
  useEffect(() => {
    if (nomeEvento && !preVisualizacao) document.title = `${nomeEvento} · Recapitulação · Dataê`
  }, [nomeEvento, preVisualizacao])

  if (!dados) {
    return (
      <div className="flex min-h-screen w-full bg-page">
        {navegacao && <BarraLateral itens={navegacao} />}
        <main className="flex min-h-screen w-full flex-1 flex-col px-6 pt-10 pb-6">
          <div className="mx-auto w-full max-w-xl">
            <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
            {erro && slug && (
              <a href={linkPublicoEvento(slug)} className="mt-4 inline-block text-[13px] font-medium text-primary underline">
                Ir para a página do evento
              </a>
            )}
            {carregando && <MensagemLista>Carregando recapitulação...</MensagemLista>}
          </div>
          {navegacao && <NavegacaoInferior className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden" itens={navegacao} />}
        </main>
      </div>
    )
  }

  const { evento, fotos } = dados
  const estiloTema = estiloTemaEvento(evento.corPrincipal)
  const numeros = [
    { valor: dados.pessoasPresentes, singular: 'pessoa confirmou presença', plural: 'pessoas confirmaram presença' },
    { valor: dados.presentesRecebidos, singular: 'presente recebido', plural: 'presentes recebidos' },
    { valor: fotos.length, singular: 'foto no mural', plural: 'fotos no mural' },
  ].filter((n) => n.valor > 0)

  return (
    <div className="flex min-h-screen w-full bg-page" style={estiloTema}>
      {navegacao && <BarraLateral itens={navegacao} />}

      <main className="relative min-h-screen w-full flex-1 pb-6">
        {preVisualizacao && (
          <div className={`${envoltorio} pt-6`}>
            <p className="rounded-[10px] bg-badge px-4 py-3 text-[12px] text-heading lg:text-[13px]">
              <strong>Pré-visualização:</strong> os convidados só conseguem abrir esta página depois da data do evento.
            </p>
          </div>
        )}

        {/* Capa */}
        <section className="pt-8 lg:pt-14">
          <div className={envoltorio}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] sm:aspect-video lg:rounded-[24px]">
              <img src={evento.bannerUrl ? urlApi(evento.bannerUrl) : imagemCapa} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[1.8px] text-white uppercase lg:top-6 lg:right-6 lg:text-[12px]">
                {rotulosTipoEvento[evento.tipo]}
              </span>
              <div className="absolute inset-x-5 bottom-6 text-white lg:inset-x-10 lg:bottom-10">
                <p className="text-[12px] font-bold tracking-[2px] uppercase lg:text-[14px]">Obrigado por fazer parte</p>
                <h1 className="mt-2 font-heading text-[30px] leading-tight font-bold lg:text-[48px]">{evento.nomeEvento}</h1>
                <p className="mt-1 text-[13px] lg:text-[16px]">{formatarDataPorExtenso(evento.dataEvento)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Agradecimento */}
        <section className="pt-10 lg:pt-16">
          <div className={`${envoltorio} lg:max-w-3xl`}>
            <RotuloSecao className="text-center">RECADO</RotuloSecao>
            <p className="mt-4 text-center font-heading text-[18px] leading-relaxed whitespace-pre-line text-heading lg:text-[24px]">
              {dados.mensagemAgradecimento}
            </p>
          </div>
        </section>

        {/* Números da festa */}
        {numeros.length > 0 && (
          <section className="pt-10 lg:pt-14">
            <div className={`${envoltorio} grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-5`}>
              {numeros.map((n) => (
                <div key={n.singular} className="rounded-[16px] bg-badge px-5 py-6 text-center">
                  <p className="font-heading text-[36px] leading-none font-bold text-primary lg:text-[44px]">{n.valor}</p>
                  <p className="mt-2 text-[13px] text-muted lg:text-[14px]">{n.valor === 1 ? n.singular : n.plural}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
            <div className={envoltorio}>
              <RotuloSecao className="text-center">MOMENTOS</RotuloSecao>
              <h2 className={`mt-4 ${titulo} text-center`}>Como foi</h2>
              <div className="mt-6 lg:mt-8">
                <ApresentacaoFotos fotos={fotos} />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 lg:mt-8 lg:grid-cols-6 lg:gap-4">
                {fotos.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFotoAberta(i)}
                    className="aspect-square cursor-zoom-in overflow-hidden rounded-[10px] bg-surface"
                    title={f.nomeAutor ? `Enviada por ${f.nomeAutor}` : undefined}
                  >
                    <img src={urlApi(f.url)} alt={f.nomeAutor ? `Foto de ${f.nomeAutor}` : 'Foto do evento'} loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <VisualizadorFotos fotos={fotos} indice={fotoAberta} onTrocar={setFotoAberta} onFechar={fecharFoto} />
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="mt-10 bg-primary-strong py-9 text-center lg:mt-16 lg:py-14">
          <p className="text-[14px] font-bold text-white lg:text-[18px]">{evento.nomeEvento}</p>
          <a
            href={linkPublicoEvento(evento.slugPublico)}
            className="mt-2 inline-block text-[12px] font-medium text-primary-soft underline lg:text-[14px]"
          >
            Ver a página do evento
          </a>
          <p className="mt-4 text-[11px] text-primary-soft">Página criada com Dataê</p>
        </footer>

        {navegacao && <NavegacaoInferior className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden" itens={navegacao} />}
      </main>
    </div>
  )
}
