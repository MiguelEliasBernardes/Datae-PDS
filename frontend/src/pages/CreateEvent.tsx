import { useState } from 'react'
import { Button } from '../components/Button'
import { ColorSwatch } from '../components/ColorSwatch'
import { Input } from '../components/Input'
import { NavBack } from '../components/NavBack'
import { OptionButton } from '../components/OptionButton'
import { themeColors } from '../data/themeColors'

const eventTypes = ['Chá de Panela', 'Casamento', 'Aniversário', 'Formatura']

const labelClass = 'text-[13px] font-medium text-heading'

/** Tela O3 - Criação de Evento. */
export function CreateEvent({ onBack }: { onBack?: () => void }) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('Casamento')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')
  const [cor, setCor] = useState(themeColors[0].value)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: enviar o novo evento para a API
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-col px-6 pt-12">
      <NavBack onBack={onBack} />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col gap-5">
        <Input
          label="Nome do evento"
          placeholder="Ex: Casamento de Ana e Pedro"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Tipo de evento</span>
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map((type) => (
              <OptionButton
                key={type}
                label={type}
                selected={tipo === type}
                onClick={() => setTipo(type)}
              />
            ))}
          </div>
        </div>

        <Input
          label="Data do evento"
          placeholder="dd/mm/aaaa"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <Input
          label="Local"
          placeholder="Endereço ou nome do local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Cor do tema</span>
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

        <Button type="submit" font="sans" className="mt-auto mb-8 h-[52px]">
          Criar evento
        </Button>
      </form>
    </div>
  )
}
