import { useMemo, useState } from 'react'
import badgePercent from '../assets/badge-percent.svg'
import banknoteStat from '../assets/banknote-stat.svg'
import circleDollar from '../assets/circle-dollar-sign.svg'
import eye from '../assets/eye.svg'
import houseWhite from '../assets/house-white.svg'
import settings from '../assets/settings.svg'
import { AccentHeading } from '../components/AccentHeading'
import { BottomNav } from '../components/BottomNav'
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
export function Rateio({ onBack }: { onBack?: () => void }) {
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-col px-6 pt-10">
      <NavBack onBack={onBack} />

      <AccentHeading>Rateio de Pagamentos</AccentHeading>

      {/* Carrossel de estatísticas */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2">
        <StatCard icon={banknoteStat} value="R$ 2.678,99" tone="lilac" label="Total despesas" />
        <StatCard icon={badgePercent} value="80%" tone="mint" label="Porcentagem paga" />
        <StatCard icon={circleDollar} value="R$ 256,97" tone="peach" label="Valor por formando" />
      </div>

      {/* Busca */}
      <Input
        className="mt-5"
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
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        {visible.length > 0 ? (
          visible.map((p) => <PaymentRow key={p.name} {...p} />)
        ) : (
          <p className="mt-8 text-center font-display text-[13px] text-muted">
            Nenhum formando encontrado.
          </p>
        )}
      </div>

      <BottomNav
        items={[
          { icon: houseWhite, label: 'Inicio', onClick: onBack },
          { icon: eye, label: 'Visualizar' },
          { icon: settings, label: 'Configurações' },
        ]}
      />
    </div>
  )
}
