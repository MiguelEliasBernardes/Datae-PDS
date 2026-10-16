import arrowDash from '../assets/arrow-big-right-dash.svg'
import { Button } from './Button'
import { Tag } from './Tag'

export interface EventCardProps {
  image: string
  title: string
  date: string
  category: string
  onAccess?: () => void
}

/** Cartão de evento da lista "Meus Eventos". */
export function EventCard({
  image,
  title,
  date,
  category,
  onAccess,
}: EventCardProps) {
  return (
    <article className="flex h-[115px] overflow-hidden rounded-[12px] bg-surface shadow-[0px_2px_6px_0px_rgba(0,0,0,0.25)]">
      <img
        src={image}
        alt=""
        className="h-full w-[111px] shrink-0 object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[14px] font-bold text-heading">
              {title}
            </h2>
            <p className="mt-1 font-display text-[12px] text-muted">
              Data: {date}
            </p>
          </div>
          <Tag>{category}</Tag>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onAccess}
          icon={<img src={arrowDash} alt="" width={17} height={17} />}
          className="mt-auto"
        >
          Acessar
        </Button>
      </div>
    </article>
  )
}
