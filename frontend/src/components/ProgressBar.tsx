/** Barra de progresso (ex.: percentual pago no rateio). */
export function ProgressBar({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-field-border ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
    </div>
  )
}
