interface FilterChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}

/** Chip de filtro da lista de convidados. */
export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-6 rounded-[8px] px-3 text-[11px] font-medium transition-colors ${
        active ? 'bg-primary text-surface' : 'bg-chip text-muted hover:bg-chip/70'
      }`}
    >
      {label}
    </button>
  )
}
