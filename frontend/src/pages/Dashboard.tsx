import circlePlus from '../assets/circle-plus.svg'
import eventFormatura from '../assets/event-formatura.png'
import eventMarinaRafael from '../assets/event-marina-rafael.png'
import { AccentHeading } from '../components/AccentHeading'
import { Button } from '../components/Button'
import { EventCard, type EventCardProps } from '../components/EventCard'

/** Dados mockados — substituir pela listagem vinda da API. */
const events: EventCardProps[] = [
  {
    image: eventMarinaRafael,
    title: 'Marina e Rafael',
    date: '20/12/2026',
    category: 'Chá de panela',
  },
  {
    image: eventFormatura,
    title: 'Formatura ADS 2026 /2',
    date: '20/12/2026',
    category: 'Formatura',
  },
]

/** Tela O2 - Dashboard "Meus Eventos". */
export function Dashboard({
  onCreate,
  onAccessEvent,
}: {
  onCreate?: () => void
  onAccessEvent?: (event: EventCardProps) => void
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-col px-6 pt-12">
      {/* Cabeçalho */}
      <AccentHeading font="heading">Meus Eventos</AccentHeading>

      {/* Ação principal */}
      <Button
        className="mt-4"
        onClick={onCreate}
        icon={<img src={circlePlus} alt="" width={24} height={24} />}
      >
        Criar Evento
      </Button>

      {/* Divisor */}
      <span className="mx-auto mt-4 h-px w-3/5 bg-field-border" />

      {/* Lista de eventos */}
      <section className="mt-6 flex flex-col gap-5">
        {events.map((event) => (
          <EventCard
            key={event.title}
            {...event}
            onAccess={() => onAccessEvent?.(event)}
          />
        ))}
      </section>
    </div>
  )
}
