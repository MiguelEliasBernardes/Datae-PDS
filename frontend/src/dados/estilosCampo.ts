/** Estilos de rótulo compartilhados entre CampoTexto, AreaTexto e páginas. */
export const tonsRotulo = {
  heading: 'text-[13px] font-medium text-heading',
  campo: 'font-display text-[14px] font-semibold text-primary-strong',
} as const

export type TomRotulo = keyof typeof tonsRotulo

/** Classes da borda: vermelha quando o campo tem erro. */
export function classeBorda(erro?: string) {
  return erro ? 'border-danger focus:border-danger' : 'border-field-border focus:border-primary'
}
