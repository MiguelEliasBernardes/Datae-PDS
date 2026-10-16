import { useMemo, useState } from 'react'
import eye from '../assets/eye.svg'
import houseWhite from '../assets/house-white.svg'
import mailCheck from '../assets/mail-check.svg'
import mailX from '../assets/mail-x.svg'
import messageWarning from '../assets/message-square-warning.svg'
import settings from '../assets/settings.svg'
import { AccentHeading } from '../components/AccentHeading'
import { BottomNav } from '../components/BottomNav'
import { FilterChip } from '../components/FilterChip'
import { GuestRow, type Guest } from '../components/GuestRow'
import { Input } from '../components/Input'
import { NavBack } from '../components/NavBack'
import { StatCard } from '../components/StatCard'

const guests: Guest[] = [
  { name: 'Ana Silva', status: 'confirmado', companions: '+ 3 Acompanhantes', obs: 'Restrição alimentar: vegetariana' },
  { name: 'Bruno Costa', status: 'confirmado', companions: '+ 1 Acompanhante', obs: 'Chega mais tarde' },
  { name: 'Carla Dias', status: 'recusado', companions: 'Nenhum acompanhante' },
  { name: 'Diego Melo', status: 'recusado', companions: 'Nenhum acompanhante' },
  { name: 'Eva Nunes', status: 'recusado', companions: 'Nenhum acompanhante' },
  { name: 'Felipe Rocha', status: 'recusado', companions: 'Nenhum acompanhante' },
  { name: 'Gabi Souza', status: 'recusado', companions: 'Nenhum acompanhante' },
  { name: 'Hugo Lima', status: 'recusado', companions: 'Nenhum acompanhante' },
]

type Filter = 'confirmados' | 'recusados' | 'observacoes'

/** Tela O5 - Gestão de Convidados. */
export function Guests({ onBack }: { onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter | null>(null)

  const toggleFilter = (f: Filter) => setFilter((cur) => (cur === f ? null : f))

  const visible = useMemo(() => {
    return guests.filter((g) => {
      if (!g.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'confirmados') return g.status === 'confirmado'
      if (filter === 'recusados') return g.status === 'recusado'
      if (filter === 'observacoes') return Boolean(g.obs)
      return true
    })
  }, [search, filter])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-col px-6 pt-10">
      <NavBack onBack={onBack} />

      <AccentHeading>Convidados</AccentHeading>

      {/* Carrossel de estatísticas */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2">
        <StatCard
          icon={mailCheck}
          value="48"
          tone="lilac"
          label={
            <>
              Confirmados{' '}
              <span className="text-[9px] font-normal">
                (Convidados e acompanhantes)
              </span>
            </>
          }
        />
        <StatCard icon={mailX} value="18" tone="rose" label="Recusados" />
        <StatCard icon={messageWarning} value="22" tone="peach" label="Observações" />
      </div>

      {/* Busca */}
      <Input
        className="mt-5"
        name="busca-convidado"
        placeholder="Convidado..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <FilterChip
          label="Confirmados"
          active={filter === 'confirmados'}
          onClick={() => toggleFilter('confirmados')}
        />
        <FilterChip
          label="Recusados"
          active={filter === 'recusados'}
          onClick={() => toggleFilter('recusados')}
        />
        <FilterChip
          label="Observações"
          active={filter === 'observacoes'}
          onClick={() => toggleFilter('observacoes')}
        />
      </div>

      {/* Lista de convidados */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        {visible.length > 0 ? (
          visible.map((g) => <GuestRow key={g.name} {...g} />)
        ) : (
          <p className="mt-8 text-center font-display text-[13px] text-muted">
            Nenhum convidado encontrado.
          </p>
        )}
      </div>

      <BottomNav
        items={[
          { icon: houseWhite, label: 'Inicio' },
          { icon: eye, label: 'Visualizar' },
          { icon: settings, label: 'Configurações' },
        ]}
      />
    </div>
  )
}
