interface AmostraCorProps {
  /** Valor CSS da cor (ex.: #534ab7). */
  cor: string
  selecionada?: boolean
  onClick?: () => void
  rotulo?: string
}

/** Círculo de cor selecionável da "Cor do tema". */
export function AmostraCor({ cor, selecionada, onClick, rotulo }: AmostraCorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      aria-pressed={selecionada}
      style={{ backgroundColor: cor }}
      className={`size-9 rounded-full transition-shadow ${
        selecionada ? 'ring-2 ring-heading ring-offset-2' : ''
      }`}
    />
  )
}
