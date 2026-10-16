export interface BottomNavItem {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
}

/** Barra de navegação inferior flutuante do painel do evento. */
export function BottomNav({
  items,
  className = '',
}: {
  items: BottomNavItem[]
  className?: string
}) {
  return (
    <nav
      className={`sticky bottom-4 mt-auto flex items-center gap-1 rounded-[30px] bg-primary-strong p-1.5 shadow-[0px_0px_5px_rgba(0,0,0,0.5)] ${className}`}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-[26px] py-2 text-[10px] font-medium transition-colors ${
            item.active ? 'bg-surface text-primary-strong' : 'text-surface'
          }`}
        >
          <img src={item.icon} alt="" width={22} height={22} />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
