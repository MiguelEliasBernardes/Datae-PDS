interface OptionButtonProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

/** Opção selecionável (ex.: "Tipo de evento"). */
export function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-[60px] rounded-[10px] border-[1.5px] text-[13px] transition-colors ${
        selected
          ? 'border-primary bg-primary font-bold text-surface'
          : 'border-field-border bg-surface font-medium text-text hover:border-primary'
      }`}
    >
      {label}
    </button>
  )
}
