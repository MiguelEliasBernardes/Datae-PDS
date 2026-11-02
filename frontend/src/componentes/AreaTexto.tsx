import type { TextareaHTMLAttributes } from 'react'
import { classeBorda, tonsRotulo, type TomRotulo } from '../dados/estilosCampo'
import { ErroCampo } from './ErroCampo'

interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo?: string
  tomRotulo?: TomRotulo
  erro?: string
}

/** Campo de texto multilinha, no estilo do "Input-Default". */
export function AreaTexto({
  rotulo,
  tomRotulo = 'heading',
  erro,
  id,
  className = '',
  ...props
}: AreaTextoProps) {
  const idCampo = id ?? rotulo?.toLowerCase().replace(/\s+/g, '-') ?? props.name

  const campo = (
    <textarea
      id={idCampo}
      aria-label={rotulo ? undefined : props.placeholder}
      aria-invalid={erro ? true : undefined}
      aria-describedby={erro && idCampo ? `${idCampo}-erro` : undefined}
      className={`min-h-[93px] w-full resize-y rounded-[10px] border-[1.5px] bg-surface px-3 py-2.5 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder ${classeBorda(erro)}`}
      {...props}
    />
  )

  if (!rotulo)
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {campo}
        <ErroCampo id={idCampo} erro={erro} />
      </div>
    )

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={idCampo} className={tonsRotulo[tomRotulo]}>
        {rotulo}
      </label>
      {campo}
      <ErroCampo id={idCampo} erro={erro} />
    </div>
  )
}
