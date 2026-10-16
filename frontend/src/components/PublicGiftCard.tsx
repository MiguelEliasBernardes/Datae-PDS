import { StatusBadge, type BadgeTone } from './StatusBadge'

export interface PublicGift {
  name: string
  price: string
  status: { label: string; tone: BadgeTone }
  action?: string
  image?: string
}

/** Cartão de presente na página pública do evento. */
export function PublicGiftCard({
  name,
  price,
  status,
  action,
  image,
  onAction,
}: PublicGift & { onAction?: () => void }) {
  return (
    <div className="flex gap-3 rounded-[12px] bg-surface p-3 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)]">
      <div
        className="size-20 shrink-0 overflow-hidden rounded-[10px] bg-theme-lilac"
      >
        {image && (
          <img src={image} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate text-[14px] font-bold text-heading">{name}</h3>
        <p className="text-[13px] text-muted">{price}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          {action && (
            <button
              type="button"
              onClick={onAction}
              className="h-7 shrink-0 rounded-[10px] bg-primary px-3 text-[14px] font-medium text-surface transition-colors hover:bg-primary/90"
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
