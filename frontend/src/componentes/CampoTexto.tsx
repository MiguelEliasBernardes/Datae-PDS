import type { InputHTMLAttributes } from 'react'
import { classeBorda, tonsRotulo, type TomRotulo } from '../dados/estilosCampo'
import { ErroCampo } from './ErroCampo'

interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  tomRotulo?: TomRotulo
  /** Mensagem de erro de validação (vinda da API ou do próprio formulário). */
  erro?: string
}

/** Campo de formulário com rótulo opcional, baseado no "Input-Default" do Figma. */
export function CampoTexto({
  rotulo,
  tomRotulo = 'heading',
  erro,
  id,
  className = '',
  ...props
}: CampoTextoProps) {
  const idCampo =
    id ?? rotulo?.toLowerCase().replace(/\s+/g, '-') ?? props.name

  const campo = (
    <input
      id={idCampo}
      aria-label={rotulo ? undefined : props.placeholder}
      aria-invalid={erro ? true : undefined}
      aria-describedby={erro && idCampo ? `${idCampo}-erro` : undefined}
      className={`h-[46px] w-full rounded-[10px] border-[1.5px] bg-surface px-3 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder ${classeBorda(erro)}`}
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
