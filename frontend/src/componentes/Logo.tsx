/** Marca do Dataê: dois círculos sobrepostos (roxo + laranja). */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="img"
      aria-label="Dataê"
    >
      <span className="size-[52px] rounded-[26px] bg-primary" />
      <span className="-ml-[26px] size-[52px] rounded-[26px] bg-accent" />
    </div>
  )
}
