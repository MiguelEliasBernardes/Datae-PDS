import { useEffect, type ReactNode } from 'react'

/** Janela sobreposta para formulários (adicionar/editar convidado, presente...). */
export function JanelaModal({
  titulo,
  aberta,
  onFechar,
  children,
}: {
  titulo: string
  aberta: boolean
  onFechar: () => void
  children: ReactNode
}) {
  // Fecha com a tecla Esc
  useEffect(() => {
    if (!aberta) return
    const aoPressionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoPressionar)
    return () => window.removeEventListener('keydown', aoPressionar)
  }, [aberta, onFechar])

  if (!aberta) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface px-6 py-6 lg:rounded-3xl lg:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-bold text-heading">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-[22px] leading-none text-muted hover:text-heading"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
