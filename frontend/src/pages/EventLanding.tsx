import { useState } from 'react'
import arrowRight from '../assets/arrow-big-right.svg'
import arrowCheck from '../assets/arrow-check.svg'
import calendar from '../assets/calendar.svg'
import eventHero from '../assets/event-hero.png'
import eyeActive from '../assets/eye-active.svg'
import giftBtn from '../assets/gift-btn.svg'
import houseWhite from '../assets/house-white.svg'
import settings from '../assets/settings.svg'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { Countdown } from '../components/Countdown'
import { Input } from '../components/Input'
import { PublicGiftCard, type PublicGift } from '../components/PublicGiftCard'
import { SectionLabel } from '../components/SectionLabel'
import { Sidebar } from '../components/Sidebar'

const gifts: PublicGift[] = [
  {
    name: 'Jogo de Panelas',
    price: 'R$ 350',
    status: { label: 'Disponível', tone: 'success' },
    action: 'Reservar',
  },
  {
    name: 'Liquidificador',
    price: 'R$ 180',
    status: { label: 'Reservado', tone: 'neutral' },
  },
  {
    name: 'Lua de Mel · cotas',
    price: 'R$ 4.000',
    status: { label: '65% arrecadado', tone: 'accent' },
    action: 'Contribuir',
  },
]

const title = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'
/** Container centralizado de cada seção. */
const wrap = 'mx-auto w-full max-w-5xl px-6 lg:px-10'
/** Linha de 2 colunas no desktop. */
const twoCol = `${wrap} lg:grid lg:grid-cols-2 lg:gap-10`

/** Tela G1 - Landing Page pública do Evento (tema roxo). */
export function EventLanding({
  onBack,
  onOpenSettings
  }: 
  { 
    onBack?: () => void ,
    onOpenSettings?: () => void

  }) {
  const [rsvp, setRsvp] = useState<'vou' | 'nao' | null>(null)
  const [name, setName] = useState('')
  const [companions, setCompanions] = useState('')
  const [restriction, setRestriction] = useState('')
  const [pixValue, setPixValue] = useState('')

  const nav = [
    { icon: houseWhite, label: 'Inicio', onClick: onBack },
    { icon: eyeActive, label: 'Visualizar', active: true },
    { icon: settings, label: 'Configurações', onClick: onOpenSettings },
  ]

  return (
    <div className="flex min-h-screen w-full bg-page">
      <Sidebar items={nav} />

      <main className="relative min-h-screen w-full flex-1 pb-6">
        {/* Hero + Convite (2 colunas no desktop) */}
        <section className="pt-8 lg:pt-14">
          <div className={`${twoCol} lg:items-center`}>
            {/* Imagem do evento */}
            <div className="relative aspect-[338/507] overflow-hidden rounded-[10px] lg:aspect-[3/4] lg:rounded-[24px]">
              <img src={eventHero} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[1.8px] text-white lg:top-6 lg:right-6 lg:text-[12px]">
                CHÁ DE PANELA
              </span>
              <h1 className="absolute top-2 left-3 font-heading text-[34px] leading-tight font-bold text-primary [text-shadow:0px_2px_4px_rgba(255,255,255,0.3)] lg:top-6 lg:left-6 lg:text-[44px]">
                Marina
                <br />& Rafael
              </h1>
              <div className="absolute inset-x-6 bottom-6 lg:max-w-xs">
                <Countdown
                  units={[
                    { value: '32', label: 'dias' },
                    { value: '14', label: 'horas' },
                    { value: '06', label: 'min' },
                  ]}
                />
              </div>
            </div>

            {/* Convite */}
            <div className="mt-8 lg:mt-0">
              <SectionLabel className="text-center lg:text-left">
                O CONVITE
              </SectionLabel>
              <h2 className={`mt-4 ${title}`}>Vem comemorar com a gente</h2>
              <p className="mt-2 text-[13px] text-muted lg:text-[15px]">
                Estamos montando nosso cantinho e queremos você junto nessa
                festa. Confirme presença, escolha um presente e traga a família.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <img src={calendar} alt="" width={24} height={24} />
                <span className="text-[14px] font-medium text-primary">
                  15 de novembro de 2026 · 16h
                </span>
              </div>

              {/* Local */}
              <div className="relative mt-6 rounded-[12px] bg-badge p-4 lg:p-5">
                <SectionLabel className="tracking-[1.4px]">LOCAL</SectionLabel>
                <p className="mt-1 text-[13px] font-medium text-heading">
                  Casa da Vovó
                </p>
                <p className="text-[12px] text-muted">
                  Rua das Flores, 120 — Torres/RS
                </p>
                <a
                  href="#"
                  className="absolute top-4 right-4 text-[12px] font-medium text-primary"
                >
                  Ver mapa
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Presença / RSVP (intro | formulário) */}
        <section className="pt-10 lg:pt-16">
          <div className={`${twoCol} lg:items-start`}>
            <div>
              <SectionLabel className="text-center lg:text-left">
                PRESENÇA
              </SectionLabel>
              <h2 className={`mt-4 ${title}`}>Você vai?</h2>
              <p className="mt-1 text-[12px] text-muted lg:text-[14px]">
                Confirme até 01/11 para ajudar na organização.
              </p>
            </div>

            <div className="mt-4 lg:mt-0">
              <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRsvp('vou')}
              aria-pressed={rsvp === 'vou'}
              className={`h-[46px] rounded-[10px] border-[1.5px] text-[13px] font-bold transition-colors ${
                rsvp === 'vou'
                  ? 'border-primary bg-primary text-surface'
                  : 'border-field-border bg-surface text-muted'
              }`}
            >
              Vou
            </button>
            <button
              type="button"
              onClick={() => setRsvp('nao')}
              aria-pressed={rsvp === 'nao'}
              className={`h-[46px] rounded-[10px] border-[1.5px] text-[13px] font-medium transition-colors ${
                rsvp === 'nao'
                  ? 'border-primary bg-primary text-surface'
                  : 'border-field-border bg-surface text-muted'
              }`}
            >
              Não vou
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              name="rsvp-nome"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              name="rsvp-acompanhantes"
              placeholder="Acompanhantes: 0"
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
            />
          </div>
          <Input
            className="mt-3"
            name="rsvp-restricao"
            placeholder="Restrição alimentar? (opcional)"
            value={restriction}
            onChange={(e) => setRestriction(e.target.value)}
          />
          <Button
            className="mt-4"
            icon={<img src={arrowRight} alt="" width={24} height={24} />}
          >
            Enviar confirmação
          </Button>
            </div>
          </div>
        </section>

        {/* Presentes (faixa, grade 3 colunas) */}
        <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
          <div className={wrap}>
            <SectionLabel className="text-center">PRESENTES</SectionLabel>
            <h2 className={`mt-4 ${title} lg:text-center`}>Lista de presentes</h2>
            <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
              Reserve um item ou contribua com uma cota.
            </p>
          <div className="mt-5 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-6">
            {gifts.map((gift) => (
              <PublicGiftCard key={gift.name} {...gift} />
            ))}
          </div>
          <Button
            className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
            icon={<img src={giftBtn} alt="" width={24} height={24} />}
          >
            Todos presentes
          </Button>
        </div>
      </section>

      {/* Presente em dinheiro / Pix (intro | card) */}
      <section className="pt-10 lg:pt-16">
        <div className={`${twoCol} lg:items-center`}>
          <div>
            <SectionLabel className="text-center lg:text-left">
              PRESENTE EM DINHEIRO
            </SectionLabel>
            <h2 className={`mt-4 ${title}`}>Prefere ajudar com Pix?</h2>
            <p className="mt-2 hidden text-[14px] text-muted lg:block">
              Contribua com qualquer valor e gere um QR Code na hora.
            </p>
          </div>
          <div className="mt-4 rounded-[12px] bg-heading p-5 lg:mt-0 lg:p-7">
            <p className="text-[13px] font-medium text-white">
              Digite o valor para gerar o QRcode
            </p>
            <Input
              className="mt-3"
              name="pix-valor"
              placeholder="R$: 50"
              value={pixValue}
              onChange={(e) => setPixValue(e.target.value)}
            />
            <Button
              className="mt-3"
              icon={<img src={arrowCheck} alt="" width={24} height={24} />}
            >
              Gerar QrCode
            </Button>
          </div>
        </div>
      </section>

      {/* Mural de fotos */}
      <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
        <div className={wrap}>
          <SectionLabel className="lg:text-center">MURAL</SectionLabel>
          <h2 className={`mt-4 ${title} lg:text-center`}>Fotos da festa</h2>
          <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
            Suas fotos aparecem aqui depois de aprovadas.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-8 lg:grid-cols-6 lg:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-[10px] ${
                  i % 2 === 0 ? 'bg-surface' : 'bg-theme-lilac'
                }`}
              />
            ))}
          </div>
          <Button
            className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
            icon={<img src={arrowRight} alt="" width={24} height={24} />}
          >
            Enviar fotos
          </Button>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-primary-strong py-9 text-center lg:py-14">
        <p className="text-[14px] font-bold text-white lg:text-[18px]">
          Marina &amp; Rafael
        </p>
        <p className="mt-1 text-[12px] text-theme-lilac lg:text-[14px]">
          15 de novembro de 2026 · 16h
        </p>
        <p className="mt-4 text-[11px] text-theme-lilac">
          Página criada com Dataê
        </p>
      </footer>

        {/* Navbar flutuante (só mobile; no desktop usa-se a sidebar) */}
        <BottomNav
          className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden"
          items={nav}
        />
      </main>
    </div>
  )
}
