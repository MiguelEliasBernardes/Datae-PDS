export interface FeatureCardProps {
  icon: string
  title: string
  onClick?: () => void
  className?: string
}

/** Card de acesso rápido do painel (Convidados, Presentes, etc.). */
export function FeatureCard({
  icon,
  title,
  onClick,
  className = '',
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-[20px] bg-surface shadow-[0px_2px_6px_0px_rgba(0,0,0,0.25)] transition-shadow hover:shadow-[0px_4px_10px_0px_rgba(0,0,0,0.3)] ${className}`}
    >
      <img src={icon} alt="" width={56} height={56} />
      <span className="px-2 text-center font-heading text-[18px] font-bold text-heading">
        {title}
      </span>
    </button>
  )
}
