import { useState } from 'react'
import banknote from '../assets/banknote-arrow-down.svg'
import bookImage from '../assets/book-image.svg'
import eye from '../assets/eye.svg'
import house from '../assets/house.svg'
import settings from '../assets/settings.svg'
import split from '../assets/split.svg'
import users from '../assets/users.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { FeatureGrid } from '../components/FeatureGrid'
import { Input } from '../components/Input'
import { NavBack } from '../components/NavBack'

/** Tela F1 - Painel do Organizador (Formatura). */
export function FormaturaPanel({
  onBack,
  onOpenFormandos,
  onOpenRateio,
  onOpenSettings
}: {
  onBack?: () => void
  onOpenFormandos?: () => void
  onOpenRateio?: () => void
  onOpenSettings?: () => void
}) {
  const [subdomain, setSubdomain] = useState('')

  const nav = [
    { icon: house, label: 'Inicio', active: true, onClick: onBack },
    { icon: eye, label: 'Visualizar' },
    { icon: settings, label: 'Configurações', onClick: onOpenSettings },
  ]

  return (
    <AppLayout items={nav}>
      <NavBack label="Eventos" onBack={onBack} />

      <AccentHeading>Formatura ADS 2026/2</AccentHeading>

      {/* Link para convidados */}
      <Input
        className="mt-5 lg:max-w-xl"
        label="Link para convidados"
        labelTone="field"
        name="subdominio"
        placeholder="digite o subdominio do link"
        value={subdomain}
        onChange={(e) => setSubdomain(e.target.value)}
      />

      {/* Acessos rápidos */}
      <div className="mt-6">
        <FeatureGrid
          items={[
            { icon: users, title: 'Formandos', onClick: onOpenFormandos },
            { icon: banknote, title: 'Despesas' },
            { icon: bookImage, title: 'Mural de fotos' },
            { icon: split, title: 'Rateio Pagamentos', onClick: onOpenRateio },
          ]}
        />
      </div>
    </AppLayout>
  )
}
