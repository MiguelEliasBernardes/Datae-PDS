import { useEffect } from 'react'
import { urlApi } from '../api/cliente'

/** O mínimo que o visualizador precisa de uma foto (serve para as fotos públicas e as da moderação). */
interface FotoVisualizada {
  id: number
  url: string
  nomeAutor: string | null
}

/**
 * Foto do mural ampliada numa janela sobre a página, em vez de abrir outra aba.
 * Com mais de uma foto, as setas (na tela e no teclado) passam para a anterior e a próxima.
 * Fecha com o X, com Esc ou clicando fora da foto.
 */
export function VisualizadorFotos({
  fotos,
  indice,
  onTrocar,
  onFechar,
}: {
  fotos: FotoVisualizada[]
  /** Foto aberta; null = fechado. */
  indice: number | null
  onTrocar: (indice: number) => void
  onFechar: () => void
}) {
  const foto = indice !== null ? fotos[indice] : undefined
  const total = fotos.length

  useEffect(() => {
    // Fechado, ou a foto saiu da lista (ex.: foi moderada e o filtro mudou)
    if (indice === null || indice >= total) return
    const aoPressionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
      else if (e.key === 'ArrowRight' && total > 1) onTrocar((indice + 1) % total)
      else if (e.key === 'ArrowLeft' && total > 1) onTrocar((indice - 1 + total) % total)
    }
    window.addEventListener('keydown', aoPressionar)
    // Trava a rolagem da página enquanto a foto está aberta
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoPressionar)
      document.body.style.overflow = overflowAntes
    }
  }, [indice, total, onTrocar, onFechar])

  if (!foto || indice === null) return null

  const botaoSeta =
    'absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-[26px] leading-none text-white hover:bg-black/65'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Foto do mural"
    >
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar"
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-black/45 text-[26px] leading-none text-white hover:bg-black/65"
      >
        ×
      </button>

      <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          key={foto.id}
          src={urlApi(foto.url)}
          alt={foto.nomeAutor ? `Foto de ${foto.nomeAutor}` : 'Foto do mural'}
          className="max-h-[80svh] max-w-full rounded-[10px] object-contain"
        />
        <figcaption className="text-center text-[13px] text-white/85">
          {foto.nomeAutor ? `Enviada por ${foto.nomeAutor}` : 'Foto do mural'}
          {total > 1 && ` · ${indice + 1} de ${total}`}
        </figcaption>
      </figure>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            className={`${botaoSeta} left-3 lg:left-6`}
            onClick={(e) => {
              e.stopPropagation()
              onTrocar((indice - 1 + total) % total)
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            className={`${botaoSeta} right-3 lg:right-6`}
            onClick={(e) => {
              e.stopPropagation()
              onTrocar((indice + 1) % total)
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
