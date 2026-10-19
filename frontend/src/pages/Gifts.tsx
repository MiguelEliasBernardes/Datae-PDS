import { useMemo, useState } from 'react'
import circleCheckBig from '../assets/circle-check-big.svg'
import circlePlus from '../assets/circle-plus.svg'
import eye from '../assets/eye.svg'
import giftStat from '../assets/gift-stat.svg'
import houseWhite from '../assets/house-white.svg'
import productSample from '../assets/product-sample.png'
import settings from '../assets/settings.svg'
import shoppingBag from '../assets/shopping-bag.svg'
import { AccentHeading } from '../components/AccentHeading'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/Button'
import { FilterChip } from '../components/FilterChip'
import { Input } from '../components/Input'
import { NavBack } from '../components/NavBack'
import { ProductRow, type Product } from '../components/ProductRow'
import { StatCard } from '../components/StatCard'

const products: Product[] = [
  { image: productSample, name: 'Jogo de Panelas', price: 'R$ 199,90', status: 'disponivel' },
  { image: productSample, name: 'Liquidificador', price: 'R$ 149,90', status: 'indisponivel' },
  { image: productSample, name: 'Cafeteira', price: 'R$ 289,90', status: 'disponivel' },
  { image: productSample, name: 'Jogo de Toalhas', price: 'R$ 99,90', status: 'disponivel' },
  { image: productSample, name: 'Air Fryer', price: 'R$ 459,90', status: 'disponivel' },
  { image: productSample, name: 'Faqueiro', price: 'R$ 129,90', status: 'disponivel' },
]

type Filter = 'disponiveis' | 'reservados' | 'cotas'

/** Tela O6 - Gestão da Lista de Presentes. */
export function Gifts({ onBack }: { onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter | null>(null)

  const toggleFilter = (f: Filter) => setFilter((cur) => (cur === f ? null : f))

  const visible = useMemo(() => {
    return products.filter((p) => {
      if (!p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'disponiveis') return p.status === 'disponivel'
      if (filter === 'reservados') return p.status === 'indisponivel'
      if (filter === 'cotas') return false
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

      <AccentHeading>Lista de Presentes</AccentHeading>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <StatCard icon={giftStat} value="15" tone="lilac" label="Presentes" />
        <StatCard icon={shoppingBag} value="9" tone="rose" label="Reservados" />
        <StatCard icon={circleCheckBig} value="6" tone="peach" label="Disponíveis" />
      </div>

      {/* Adicionar presente */}
      <Button
        className="mt-5 lg:max-w-xs"
        icon={<img src={circlePlus} alt="" width={24} height={24} />}
      >
        Adicionar Presente
      </Button>

      {/* Busca */}
      <Input
        className="mt-4 lg:max-w-md"
        name="busca-presente"
        placeholder="Presente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <FilterChip
          label="Disponíveis"
          active={filter === 'disponiveis'}
          onClick={() => toggleFilter('disponiveis')}
        />
        <FilterChip
          label="Reservados"
          active={filter === 'reservados'}
          onClick={() => toggleFilter('reservados')}
        />
        <FilterChip
          label="Cotas"
          active={filter === 'cotas'}
          onClick={() => toggleFilter('cotas')}
        />
      </div>

      {/* Lista de produtos */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {visible.length > 0 ? (
          visible.map((p) => <ProductRow key={p.name} {...p} />)
        ) : (
          <p className="mt-8 text-center font-display text-[13px] text-muted lg:col-span-2">
            Nenhum presente encontrado.
          </p>
        )}
      </div>
    </AppLayout>
  )
}
