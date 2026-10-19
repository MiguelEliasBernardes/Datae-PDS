import type { BottomNavItem } from './BottomNav'

/** Navegação lateral (somente desktop). No mobile usa-se a BottomNav. */
export function Sidebar({ items }: { items: BottomNavItem[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-primary-strong px-4 py-7 lg:flex">
      <div className="mb-8 px-3 font-heading text-[24px] font-bold text-white">
        Dataê
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            aria-current={item.active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[14px] font-medium transition-colors ${
              item.active
                ? 'bg-surface text-primary-strong'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <img src={item.icon} alt="" width={22} height={22} />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
