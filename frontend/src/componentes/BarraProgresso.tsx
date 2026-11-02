/** Barra de progresso (ex.: percentual pago no rateio). */
export function BarraProgresso({
  valor,
  className = '',
}: {
  valor: number
  className?: string
}) {
  const percentual = Math.min(100, Math.max(0, valor))
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-field-border ${className}`}
      role="progressbar"
      aria-valuenow={percentual}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-success" style={{ width: `${percentual}%` }} />
    </div>
  )
}
