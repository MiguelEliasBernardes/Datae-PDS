interface ChipFiltroProps {
  rotulo: string
  ativo?: boolean
  onClick?: () => void
}

/** Chip de filtro das listas (convidados, presentes...). */
export function ChipFiltro({ rotulo, ativo, onClick }: ChipFiltroProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`h-6 rounded-[8px] px-3 text-[11px] font-medium transition-colors ${
        ativo ? 'bg-primary text-surface' : 'bg-chip text-muted hover:bg-chip/70'
      }`}
    >
      {rotulo}
    </button>
  )
}
