import { useState } from 'react'
import { linkConvite } from '../dados/rotas'

/** Código e link de um convite, com botões de copiar (para mandar por mensagem ao formando). */
export function CartaoConvite({ codigo }: { codigo: string }) {
  const [aviso, setAviso] = useState<string | null>(null)
  const link = linkConvite(codigo)

  async function copiar(texto: string, mensagem: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(mensagem)
    } catch {
      setAviso('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-badge p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[18px] font-bold tracking-[3px] text-heading">{codigo}</span>
        <button
          type="button"
          onClick={() => void copiar(codigo, 'Código copiado!')}
          className="shrink-0 text-[12px] font-medium text-primary underline"
        >
          Copiar código
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-display text-[12px] text-muted">{link}</span>
        <button
          type="button"
          onClick={() => void copiar(link, 'Link copiado!')}
          className="shrink-0 text-[12px] font-medium text-primary underline"
        >
          Copiar link
        </button>
      </div>
      {aviso && (
        <span role="status" className="text-[12px] text-muted">
          {aviso}
        </span>
      )}
    </div>
  )
}
