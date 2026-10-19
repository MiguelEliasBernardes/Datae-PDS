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
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto w-full max-w-[402px] px-6 pt-12 pb-10 lg:max-w-5xl lg:px-10 lg:pt-16">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AccentHeading font="heading">Meus Eventos</AccentHeading>
          <Button
            className="lg:max-w-[220px]"
            onClick={onCreate}
            icon={<img src={circlePlus} alt="" width={24} height={24} />}
          >
            Criar Evento
          </Button>
        </div>

        {/* Divisor (só mobile) */}
        <span className="mx-auto mt-4 block h-px w-3/5 bg-field-border lg:hidden" />

        {/* Lista de eventos */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.title}
              {...event}
              onAccess={() => onAccessEvent?.(event)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
