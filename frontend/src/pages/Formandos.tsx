import { useMemo, useState } from 'react'
import circlePlus from '../assets/circle-plus.svg'
import eye from '../assets/eye.svg'
import graduationCap from '../assets/graduation-cap.svg'
import houseWhite from '../assets/house-white.svg'
import settings from '../assets/settings.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/Button'
import { FilterChip } from '../components/FilterChip'
import { Input } from '../components/Input'
import { MemberRow, type Member } from '../components/MemberRow'
import { NavBack } from '../components/NavBack'
import { StatCard } from '../components/StatCard'

const members: Member[] = [
  { name: 'Ana Silva', role: 'membro' },
  { name: 'João', role: 'administrador' },
  { name: 'Beatriz Lima', role: 'membro' },
  { name: 'Carlos Souza', role: 'membro' },
  { name: 'Marina Dias', role: 'administrador' },
]

type Filter = 'membro' | 'administrador'

/** Tela F2 - Formandos. */
export function Formandos({ onBack }: { onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter | null>(null)

  const toggleFilter = (f: Filter) => setFilter((cur) => (cur === f ? null : f))

  const visible = useMemo(() => {
    return members.filter((m) => {
      if (!m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter) return m.role === filter
      return true
    })
  }, [search, filter])

  const nav = [
    { icon: houseWhite, label: 'Inicio', onClick: onBack },
    { icon: eye, label: 'Visualizar' },
    { icon: settings, label: 'Configurações' },
  ]

  return (
    <AppLayout items={nav}>
      <NavBack onBack={onBack} />

      <AccentHeading>Formandos</AccentHeading>

      {/* Estatística */}
      <div className="mt-5 lg:max-w-sm">
        <StatCard
          icon={graduationCap}
          value="20"
          tone="lilac"
          label="Formandos Cadastrados"
        />
      </div>

      {/* Adicionar formando */}
      <Button
        className="mt-5 lg:max-w-xs"
        icon={<img src={circlePlus} alt="" width={24} height={24} />}
      >
        Adicionar Formando
      </Button>

      {/* Busca */}
      <Input
        className="mt-4 lg:max-w-md"
        name="busca-formando"
        placeholder="Formando..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <FilterChip
          label="Membro"
          active={filter === 'membro'}
          onClick={() => toggleFilter('membro')}
        />
        <FilterChip
          label="Administrador"
          active={filter === 'administrador'}
          onClick={() => toggleFilter('administrador')}
        />
      </div>

      {/* Lista de formandos */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {visible.length > 0 ? (
          visible.map((m) => <MemberRow key={m.name} {...m} />)
        ) : (
          <p className="mt-8 text-center font-display text-[13px] text-muted lg:col-span-2">
            Nenhum formando encontrado.
          </p>
        )}
      </div>
    </AppLayout>
  )
}
