import { useMemo, useState } from 'react'
import badgePercent from '../assets/badge-percent.svg'
import banknoteStat from '../assets/banknote-stat.svg'
import circleDollar from '../assets/circle-dollar-sign.svg'
import eye from '../assets/eye.svg'
import houseWhite from '../assets/house-white.svg'
import settings from '../assets/settings.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { FilterChip } from '../components/FilterChip'
import { Input } from '../components/Input'
import { PaymentRow, type Payment } from '../components/PaymentRow'
import { NavBack } from '../components/NavBack'
import { StatCard } from '../components/StatCard'

const payments: Payment[] = [
  { name: 'Miguel', status: 'pendente', paid: 'R$ 199,90', total: 'R$ 256,97', percent: 66 },
  { name: 'Ana Silva', status: 'pago', paid: 'R$ 256,97', total: 'R$ 256,97', percent: 100 },
  { name: 'João', status: 'pendente', paid: 'R$ 100,00', total: 'R$ 256,97', percent: 39 },
  { name: 'Beatriz Lima', status: 'pago', paid: 'R$ 256,97', total: 'R$ 256,97', percent: 100 },
]

type Filter = 'pago' | 'pendente'

/** Tela F4 - Rateio de Pagamentos. */
export function Rateio({ 
  onBack,
  onOpenSettings,
  onOpenPreview 
  }: {
  onBack?: () => void
  onOpenSettings?: () => void
  onOpenPreview?: () => void
  }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter | null>(null)

  const toggleFilter = (f: Filter) => setFilter((cur) => (cur === f ? null : f))

  const visible = useMemo(() => {
    return payments.filter((p) => {
      if (!p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter) return p.status === filter
      return true
    })
  }, [search, filter])

  const nav = [
    { icon: houseWhite, label: 'Inicio', onClick: onBack },
    { icon: eye, label: 'Visualizar', onClick: onOpenPreview },
    { icon: settings, label: 'Configurações', onClick: onOpenSettings },
  ]

  return (
    <AppLayout items={nav}>
      <NavBack onBack={onBack} />

      <AccentHeading>Rateio de Pagamentos</AccentHeading>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <StatCard icon={banknoteStat} value="R$ 2.678,99" tone="lilac" label="Total despesas" />
        <StatCard icon={badgePercent} value="80%" tone="mint" label="Porcentagem paga" />
        <StatCard icon={circleDollar} value="R$ 256,97" tone="peach" label="Valor por formando" />
      </div>

      {/* Busca */}
      <Input
        className="mt-5 lg:max-w-md"
        name="busca-rateio"
        placeholder="Formando..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <FilterChip
          label="Pago"
          active={filter === 'pago'}
          onClick={() => toggleFilter('pago')}
        />
        <FilterChip
          label="Pendente"
          active={filter === 'pendente'}
          onClick={() => toggleFilter('pendente')}
        />
      </div>

      {/* Lista de rateio */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {visible.length > 0 ? (
          visible.map((p) => <PaymentRow key={p.name} {...p} />)
        ) : (
          <p className="mt-8 text-center font-display text-[13px] text-muted lg:col-span-2">
            Nenhum formando encontrado.
          </p>
        )}
      </div>
    </AppLayout>
  )
}
