import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'principal' | 'secundario' | 'perigo'
  tamanho?: 'medio' | 'pequeno'
  /** Família do rótulo. Por padrão: principal → Inclusive Sans, secundário → Inter. */
  fonte?: 'display' | 'sans'
  /** Ícone opcional exibido ao final do rótulo (ex.: seta, circle-plus). */
  icone?: ReactNode
  /** Mostra "Aguarde..." e bloqueia cliques enquanto uma chamada à API está em andamento. */
  carregando?: boolean
}

const variantes = {
  principal: 'bg-primary text-surface hover:bg-primary/90',
  secundario:
    'bg-surface text-primary-strong border-[1.5px] border-primary hover:bg-primary/5',
  perigo:
    'bg-surface text-danger border-[1.5px] border-danger hover:bg-danger-bg',
} as const

const tamanhos = {
  medio: 'h-12 rounded-[10px] text-[14px]',
  pequeno: 'h-9 rounded-[9px] text-[13px]',
} as const

const fontes = {
  display: 'font-display',
  sans: 'font-sans',
} as const

/** Botão reutilizável nas variantes "principal" e "secundário" do Figma. */
export function Botao({
  variante = 'principal',
  tamanho = 'medio',
  fonte,
  icone,
  carregando = false,
  disabled,
  children,
  className = '',
  ...props
}: BotaoProps) {
  const classeFonte = fontes[fonte ?? (variante === 'principal' ? 'display' : 'sans')]
  return (
    <button
      className={`relative flex w-full items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante]} ${tamanhos[tamanho]} ${classeFonte} ${className}`}
      disabled={disabled || carregando}
      aria-busy={carregando}
      {...props}
    >
      <span>{carregando ? 'Aguarde...' : children}</span>
      {icone && !carregando && (
        <span className="absolute right-4 flex items-center">{icone}</span>
      )}
    </button>
  )
}
