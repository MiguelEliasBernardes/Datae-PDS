import { useEffect, useState } from 'react'
import { urlApi } from '../api/cliente'
import type { FotoPublica } from '../api/tipos'

const INTERVALO_MS = 4500

/** Quem pediu menos movimento no sistema não recebe a troca automática das fotos. */
const prefereMenosMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Apresentação das fotos do mural na recapitulação: troca sozinha a cada poucos segundos, com transição suave.
 * Para quando o mouse está em cima (ou o foco num botão) e pode ser controlada pelas setas.
 */
export function ApresentacaoFotos({ fotos }: { fotos: FotoPublica[] }) {
  const [atual, setAtual] = useState(0)
  const [pausada, setPausada] = useState(prefereMenosMovimento)
  const total = fotos.length

  useEffect(() => {
    if (pausada || total < 2) return
    const relogio = window.setInterval(() => setAtual((i) => (i + 1) % total), INTERVALO_MS)
    return () => window.clearInterval(relogio)
  }, [pausada, total])

  if (total === 0) return null

  const indice = atual % total
  const foto = fotos[indice]
  const ir = (passo: number) => setAtual((i) => (i + passo + total) % total)

  return (
    <div
      className="relative overflow-hidden rounded-[16px] bg-heading shadow-[0px_4px_16px_0px_rgba(0,0,0,0.18)]"
      onMouseEnter={() => setPausada(true)}
      onMouseLeave={() => setPausada(prefereMenosMovimento())}
      aria-roledescription="apresentação"
      aria-label="Fotos do evento"
    >
      <div className="relative aspect-4/3 w-full lg:aspect-video">
        {/* Só a foto atual e as vizinhas ficam montadas: a transição funciona e o resto só baixa quando chegar a vez */}
        {fotos.map((f, i) => {
          const distancia = Math.min(Math.abs(i - indice), total - Math.abs(i - indice))
          if (distancia > 1) return null
          return (
            <img
              key={f.id}
              src={urlApi(f.url)}
              alt={f.nomeAutor ? `Foto enviada por ${f.nomeAutor}` : 'Foto do evento'}
              aria-hidden={i !== indice}
              className={`absolute inset-0 size-full object-contain transition-opacity duration-1000 ${i === indice ? 'opacity-100' : 'opacity-0'}`}
            />
          )
        })}
      </div>

      {/* Legenda e contador */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/60 to-transparent px-4 pt-10 pb-3 text-white">
        <span className="min-w-0 truncate text-[12px] lg:text-[14px]">{foto.nomeAutor ? `Por ${foto.nomeAutor}` : ''}</span>
        <span className="shrink-0 text-[12px] font-medium lg:text-[14px]" aria-live="polite">
          {indice + 1} / {total}
        </span>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(-1)}
            onFocus={() => setPausada(true)}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[20px] font-bold text-heading hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => ir(1)}
            onFocus={() => setPausada(true)}
            aria-label="Próxima foto"
            className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[20px] font-bold text-heading hover:bg-white"
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
