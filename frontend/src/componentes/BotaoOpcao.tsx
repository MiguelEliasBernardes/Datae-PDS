interface BotaoOpcaoProps {
  rotulo: string
  selecionado?: boolean
  onClick?: () => void
}

/** Opção selecionável (ex.: "Tipo de evento"). */
export function BotaoOpcao({ rotulo, selecionado, onClick }: BotaoOpcaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionado}
      className={`h-[60px] rounded-[10px] border-[1.5px] text-[13px] transition-colors ${
        selecionado
          ? 'border-primary bg-primary font-bold text-surface'
          : 'border-field-border bg-surface font-medium text-text hover:border-primary'
      }`}
    >
      {rotulo}
    </button>
  )
}
