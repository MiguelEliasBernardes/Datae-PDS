import type { InputHTMLAttributes } from 'react'

/** Estilos de rótulo compartilhados entre Input e Textarea. */
export const labelTones = {
  heading: 'text-[13px] font-medium text-heading',
  field: 'font-display text-[14px] font-semibold text-primary-strong',
} as const

export type LabelTone = keyof typeof labelTones

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  labelTone?: LabelTone
}

/** Campo de formulário com rótulo opcional, baseado no "Input-Default" do Figma. */
export function Input({
  label,
  labelTone = 'heading',
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId =
    id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? props.name

  const input = (
    <input
      id={inputId}
      aria-label={label ? undefined : props.placeholder}
      className="h-[46px] w-full rounded-[10px] border-[1.5px] border-field-border bg-surface px-3 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder focus:border-primary"
      {...props}
    />
  )

  if (!label) return <div className={className}>{input}</div>

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className={labelTones[labelTone]}>
        {label}
      </label>
      {input}
    </div>
  )
}
