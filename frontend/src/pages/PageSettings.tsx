import { useState } from 'react'
import eye from '../assets/eye.svg'
import houseWhite from '../assets/house-white.svg'
import settingsActive from '../assets/settings-active.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { ColorSwatch } from '../components/ColorSwatch'
import { ImageUpload } from '../components/ImageUpload'
import { Input, labelTones } from '../components/Input'
import { NavBack } from '../components/NavBack'
import { SettingToggle } from '../components/SettingToggle'
import { Textarea } from '../components/Textarea'
import { themeColors } from '../data/themeColors'

/** Tela O7 - Configurações da página. */
export function PageSettings({ onBack }: { onBack?: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [secondName, setSecondName] = useState('')
  const [message, setMessage] = useState('')
  const [local, setLocal] = useState('')
  const [date, setDate] = useState('')
  const [cor, setCor] = useState(themeColors[0].value)

  const nav = [
    { icon: houseWhite, label: 'Inicio', onClick: onBack },
    { icon: eye, label: 'Visualizar' },
    { icon: settingsActive, label: 'Configurações', active: true },
  ]

  return (
    <AppLayout items={nav}>
      <NavBack onBack={onBack} />

      <AccentHeading>Configurações da página</AccentHeading>

      <form className="mt-6 flex flex-col gap-5 lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5">
        <div className="lg:col-span-2">
          <ImageUpload label="Imagem banner" />
        </div>

        <Input
          label="Primeiro nome"
          labelTone="field"
          placeholder="Ex: Rafael"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label="Segundo nome"
          labelTone="field"
          placeholder="Ex: Marina"
          value={secondName}
          onChange={(e) => setSecondName(e.target.value)}
        />
        <Textarea
          className="lg:col-span-2"
          label="Mensagem convite"
          labelTone="field"
          placeholder="Digite o que você colocaria no convite"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Input
          label="Local"
          labelTone="field"
          placeholder="Endereço ou nome do local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
        <Input
          label="Data"
          labelTone="field"
          placeholder="dd/mm/aa"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex flex-col gap-2 lg:col-span-2">
          <span className={labelTones.field}>Cor tema</span>
          <div className="flex gap-2">
            {themeColors.map((c) => (
              <ColorSwatch
                key={c.value}
                color={c.value}
                label={c.name}
                selected={cor === c.value}
                onClick={() => setCor(c.value)}
              />
            ))}
          </div>
        </div>
      </form>

      <div className="mt-8">
        <AccentHeading>Configurações opcionais</AccentHeading>
      </div>

      <div className="mt-6 mb-6 flex flex-col gap-6 lg:max-w-3xl">
        <SettingToggle
          title="Lista de presentes"
          description="Adiciona uma lista de presentes a página, onde convidados podem reservar ou pagar cotas de presentes cadastrados."
        />
        <SettingToggle
          title="Pix dinâmico"
          defaultChecked
          description="Adicionar opção de presente via pix, convidado digita o valor e gerar um QRCode para pagamento, com confirmação automática."
        />
        <SettingToggle
          title="Mural de fotos"
          defaultChecked
          description="Ativar opção de mural de fotos onde convidados podem enviar fotos e você libera se elas podem ou não aparecer no mural."
        />
      </div>
    </AppLayout>
  )
}
