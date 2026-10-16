interface ToggleSwitchProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
}

/** Switch on/off (switch-ativado / switch-desativado do Figma). */
export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={`relative h-[23px] w-[48px] shrink-0 rounded-[20px] border transition-colors ${
        checked ? 'border-white bg-primary' : 'border-primary bg-surface'
      }`}
    >
      <span
        className={`absolute top-1/2 size-[17px] -translate-y-1/2 rounded-full transition-all ${
          checked ? 'left-[27px] bg-white' : 'left-[3px] bg-primary-strong'
        }`}
      />
    </button>
  )
}
