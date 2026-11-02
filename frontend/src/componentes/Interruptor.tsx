interface InterruptorProps {
  ativo: boolean
  onAlterar?: (ativo: boolean) => void
  rotulo?: string
}

/** Interruptor liga/desliga (switch-ativado / switch-desativado do Figma). */
export function Interruptor({ ativo, onAlterar, rotulo }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
      onClick={() => onAlterar?.(!ativo)}
      className={`relative h-[23px] w-[48px] shrink-0 rounded-[20px] border transition-colors ${
        ativo ? 'border-white bg-primary' : 'border-primary bg-surface'
      }`}
    >
      <span
        className={`absolute top-1/2 size-[17px] -translate-y-1/2 rounded-full transition-all ${
          ativo ? 'left-[27px] bg-white' : 'left-[3px] bg-primary-strong'
        }`}
      />
    </button>
  )
}
