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
    <div className="flex min-h-screen w-full justify-center lg:items-center lg:p-10">
      <div className="flex min-h-screen w-full max-w-[402px] flex-col bg-surface px-6 pt-12 lg:min-h-0 lg:max-w-2xl lg:rounded-3xl lg:px-10 lg:py-10 lg:shadow-[0_10px_40px_rgba(38,33,92,0.12)]">
        <NavBack onBack={onBack} />

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-1 flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5"
        >
          <Input
            className="lg:col-span-2"
            label="Nome do evento"
            placeholder="Ex: Casamento de Ana e Pedro"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <div className="flex flex-col gap-2 lg:col-span-2">
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

          <div className="flex flex-col gap-2 lg:col-span-2">
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

          <Button
            type="submit"
            font="sans"
            className="mt-auto mb-8 h-[52px] lg:col-span-2 lg:mt-2 lg:mb-0"
          >
            Criar evento
          </Button>
        </form>
      </div>
    </div>
  )
}
