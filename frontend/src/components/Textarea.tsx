import type { TextareaHTMLAttributes } from 'react'
import { labelTones, type LabelTone } from './Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  labelTone?: LabelTone
}

/** Campo de texto multilinha, no estilo do "Input-Default". */
export function Textarea({
  label,
  labelTone = 'heading',
  id,
  className = '',
  ...props
}: TextareaProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? props.name

  const field = (
    <textarea
      id={fieldId}
      aria-label={label ? undefined : props.placeholder}
      className="min-h-[93px] w-full resize-y rounded-[10px] border-[1.5px] border-field-border bg-surface px-3 py-2.5 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder focus:border-primary"
      {...props}
    />
  )

  if (!label) return <div className={className}>{field}</div>

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className={labelTones[labelTone]}>
        {label}
      </label>
      {field}
    </div>
  )
}
