import bookImage from '../assets/book-image.svg'
import circleDollarSign from '../assets/circle-dollar-sign.svg'
import clipboard from '../assets/clipboard.svg'
import eye from '../assets/eye.svg'
import gift from '../assets/gift.svg'
import house from '../assets/house.svg'
import mailCheck from '../assets/mail-check.svg'
import pkg from '../assets/package.svg'
import pix from '../assets/pix.svg'
import settings from '../assets/settings.svg'
import share2 from '../assets/share-2.svg'
import users from '../assets/users.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { FeatureGrid } from '../components/FeatureGrid'
import { NavBack } from '../components/NavBack'
import { StatCard, type StatCardProps } from '../components/StatCard'

const stats: StatCardProps[] = [
  { icon: mailCheck, value: '48', label: 'Pessoas confirmadas', tone: 'lilac' },
  {
    icon: circleDollarSign,
    value: 'R$ 3.200',
    label: 'Dinheiro arrecadado',
    tone: 'mint',
  },
  { icon: pkg, value: '9/15', label: 'Itens reservados', tone: 'peach' },
]

/** Tela O4 - Painel do Evento. */
export function EventPanel({
  onBack,
  onOpenGuests,
  onOpenGifts,
  onOpenSettings,
  onOpenPreview,
}: {
  onBack?: () => void
  onOpenGuests?: () => void
  onOpenGifts?: () => void
  onOpenSettings?: () => void
  onOpenPreview?: () => void
}) {
  const nav = [
    { icon: house, label: 'Inicio', active: true },
    { icon: eye, label: 'Visualizar', onClick: onOpenPreview },
    { icon: settings, label: 'Configurações', onClick: onOpenSettings },
  ]

  return (
    <AppLayout items={nav}>
      <NavBack label="Eventos" onBack={onBack} />

      <AccentHeading>Chá de panela Marina e Rafael</AccentHeading>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {stats.map((stat) => (
          <StatCard key={stat.value} {...stat} />
        ))}
      </div>

      {/* Link para convidados */}
      <div className="mt-5 flex flex-col gap-2 lg:max-w-xl">
        <span className="font-display text-[14px] font-semibold text-primary-strong">
          Link para convidados
        </span>
        <div className="relative">
          <input
            placeholder="digite o subdominio da página"
            className="h-[46px] w-full rounded-[10px] border-[1.5px] border-field-border bg-surface pr-20 pl-3 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder focus:border-primary"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <button type="button" aria-label="Copiar link">
              <img src={clipboard} alt="" width={24} height={24} />
            </button>
            <button type="button" aria-label="Compartilhar">
              <img src={share2} alt="" width={28} height={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Acessos rápidos */}
      <div className="mt-6">
        <FeatureGrid
          items={[
            { icon: users, title: 'Convidados', onClick: onOpenGuests },
            { icon: gift, title: 'Presentes', onClick: onOpenGifts },
            { icon: bookImage, title: 'Mural de fotos' },
            { icon: pix, title: 'Financeiro (PIX)' },
          ]}
        />
      </div>
    </AppLayout>
  )
}
