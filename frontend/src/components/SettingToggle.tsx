import { useState } from 'react'
import { ToggleSwitch } from './ToggleSwitch'

interface SettingToggleProps {
  title: string
  description: string
  defaultChecked?: boolean
}

/** Linha de configuração opcional: título, descrição e switch. */
export function SettingToggle({
  title,
  description,
  defaultChecked = false,
}: SettingToggleProps) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="font-display text-[14px] font-semibold text-primary-strong">
          {title}
        </p>
        <p className="mt-1 font-display text-[10px] text-muted">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={setChecked} label={title} />
    </div>
  )
}
