import setaEsquerda from '../assets/chevron-left.svg'

interface BotaoVoltarProps {
  rotulo?: string
  onVoltar?: () => void
}

/** Navegação "Voltar" com seta, baseada no componente Nav-Voltar do Figma. */
export function BotaoVoltar({ rotulo = 'Voltar', onVoltar }: BotaoVoltarProps) {
  return (
    <button
      type="button"
      onClick={onVoltar}
      className="flex h-16 items-center gap-2.5 font-heading text-[16px] font-medium text-heading"
    >
      <img src={setaEsquerda} alt="" width={10} height={18} />
      {rotulo}
    </button>
  )
}
