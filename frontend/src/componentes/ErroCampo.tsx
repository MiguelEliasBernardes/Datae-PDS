/** Mensagem de erro exibida abaixo de um campo. */
export function ErroCampo({ id, erro }: { id?: string; erro?: string }) {
  if (!erro) return null
  return (
    <p id={id ? `${id}-erro` : undefined} role="alert" className="text-[12px] text-danger">
      {erro}
    </p>
  )
}
