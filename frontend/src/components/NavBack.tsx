import chevronLeft from '../assets/chevron-left.svg'

interface NavBackProps {
  label?: string
  onBack?: () => void
}

/** Navegação "Voltar" com seta, baseada no componente Nav-Voltar do Figma. */
export function NavBack({ label = 'Voltar', onBack }: NavBackProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex h-16 items-center gap-2.5 font-heading text-[16px] font-medium text-heading"
    >
      <img src={chevronLeft} alt="" width={10} height={18} />
      {label}
    </button>
  )
}
