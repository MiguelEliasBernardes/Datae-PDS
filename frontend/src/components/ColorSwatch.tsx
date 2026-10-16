interface ColorSwatchProps {
  /** Valor CSS da cor (ex.: var(--color-theme-purple) ou #534ab7). */
  color: string
  selected?: boolean
  onClick?: () => void
  label?: string
}

/** Círculo de cor selecionável da "Cor do tema". */
export function ColorSwatch({ color, selected, onClick, label }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      style={{ backgroundColor: color }}
      className={`size-9 rounded-full transition-shadow ${
        selected ? 'ring-2 ring-heading ring-offset-2' : ''
      }`}
    />
  )
}
