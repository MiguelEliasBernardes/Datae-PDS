import { useCallback, useState, type CSSProperties } from 'react'
import setaDireita from '../assets/arrow-big-right.svg'
import setaCheck from '../assets/arrow-check.svg'
import calendario from '../assets/calendar.svg'
import imagemCapa from '../assets/event-hero.png'
import olhoAtivo from '../assets/eye-active.svg'
import presenteBotao from '../assets/gift-btn.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { obterEvento } from '../api/eventos'
import { listarPresentes } from '../api/presentes'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraLateral } from '../componentes/BarraLateral'
import { Botao } from '../componentes/Botao'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoPresentePublico } from '../componentes/CartaoPresentePublico'
import { ContagemRegressiva } from '../componentes/ContagemRegressiva'
import { MensagemLista } from '../componentes/MensagemLista'
import { NavegacaoInferior } from '../componentes/NavegacaoInferior'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { formatarDataPorExtenso, formatarMoeda, rotulosTipoEvento } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

const titulo = 'font-heading text-[19px] font-bold text-heading lg:text-[28px]'
/** Container centralizado de cada seção. */
const envoltorio = 'mx-auto w-full max-w-5xl px-6 lg:px-10'
/** Linha de 2 colunas no desktop. */
const duasColunas = `${envoltorio} lg:grid lg:grid-cols-2 lg:gap-10`

/** Quanto falta até a data do evento, em dias/horas/minutos. */
function tempoRestante(dataIso: string, agora: number) {
  const restante = Math.max(0, new Date(dataIso).getTime() - agora)
  const minutosTotais = Math.floor(restante / 60_000)
  return [
    { valor: String(Math.floor(minutosTotais / 1440)), rotulo: 'dias' },
    { valor: String(Math.floor((minutosTotais % 1440) / 60)).padStart(2, '0'), rotulo: 'horas' },
    { valor: String(minutosTotais % 60).padStart(2, '0'), rotulo: 'min' },
  ]
}

/**
 * Tela G1 - Página pública do Evento (pré-visualização do organizador).
 * Mostra os dados reais do evento; confirmação de presença, Pix e mural
 * ainda não têm rotas públicas no backend.
 */
export function PaginaEvento({
  eventoId,
  onVoltar,
  onAbrirConfiguracoes,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirConfiguracoes: () => void
}) {
  const carregar = useCallback(
    () => Promise.all([obterEvento(eventoId), listarPresentes(eventoId)]),
    [eventoId],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const [agora] = useState(() => Date.now())

  const [presenca, setPresenca] = useState<'vou' | 'nao' | null>(null)
  const [nome, setNome] = useState('')
  const [acompanhantes, setAcompanhantes] = useState('')
  const [restricao, setRestricao] = useState('')
  const [valorPix, setValorPix] = useState('')

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olhoAtivo, rotulo: 'Visualizar', ativo: true },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  if (!dados) {
    return (
      <div className="flex min-h-screen w-full bg-page">
        <BarraLateral itens={navegacao} />
        <main className="flex min-h-screen w-full flex-1 flex-col px-6 pt-10 pb-6">
          <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
          {carregando && <MensagemLista>Carregando página...</MensagemLista>}
          <NavegacaoInferior className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden" itens={navegacao} />
        </main>
      </div>
    )
  }

  const [evento, presentes] = dados
  const dataPorExtenso = formatarDataPorExtenso(evento.dataEvento)

  // A cor escolhida nas configurações substitui o roxo padrão nesta página
  const estiloTema = evento.corPrincipal
    ? ({ '--color-primary': evento.corPrincipal } as CSSProperties)
    : undefined

  return (
    <div className="flex min-h-screen w-full bg-page" style={estiloTema}>
      <BarraLateral itens={navegacao} />

      <main className="relative min-h-screen w-full flex-1 pb-6">
        {/* Capa + Convite (2 colunas no desktop) */}
        <section className="pt-8 lg:pt-14">
          <div className={`${duasColunas} lg:items-center`}>
            {/* Imagem do evento */}
            <div className="relative aspect-[338/507] overflow-hidden rounded-[10px] lg:aspect-[3/4] lg:rounded-[24px]">
              <img src={imagemCapa} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[1.8px] text-white uppercase lg:top-6 lg:right-6 lg:text-[12px]">
                {rotulosTipoEvento[evento.tipo]}
              </span>
              <h1 className="absolute top-8 left-3 max-w-[85%] font-heading text-[34px] leading-tight font-bold text-primary [text-shadow:0px_2px_4px_rgba(255,255,255,0.3)] lg:top-12 lg:left-6 lg:text-[44px]">
                {evento.nomeEvento}
              </h1>
              <div className="absolute inset-x-6 bottom-6 lg:max-w-xs">
                <ContagemRegressiva unidades={tempoRestante(evento.dataEvento, agora)} />
              </div>
            </div>

            {/* Convite */}
            <div className="mt-8 lg:mt-0">
              <RotuloSecao className="text-center lg:text-left">
                O CONVITE
              </RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Vem comemorar com a gente</h2>
              <p className="mt-2 text-[13px] whitespace-pre-line text-muted lg:text-[15px]">
                {evento.descricao ?? 'Confirme presença, escolha um presente e traga a família.'}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <img src={calendario} alt="" width={24} height={24} />
                <span className="text-[14px] font-medium text-primary">{dataPorExtenso}</span>
              </div>

              {/* Local */}
              {evento.local && (
                <div className="relative mt-6 rounded-[12px] bg-badge p-4 lg:p-5">
                  <RotuloSecao className="tracking-[1.4px]">LOCAL</RotuloSecao>
                  <p className="mt-1 pr-16 text-[13px] font-medium text-heading">{evento.local}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.local)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-4 right-4 text-[12px] font-medium text-primary"
                  >
                    Ver mapa
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Presença (introdução | formulário) */}
        <section className="pt-10 lg:pt-16">
          <div className={`${duasColunas} lg:items-start`}>
            <div>
              <RotuloSecao className="text-center lg:text-left">
                PRESENÇA
              </RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Você vai?</h2>
              <p className="mt-1 text-[12px] text-muted lg:text-[14px]">
                Confirme para ajudar na organização.
              </p>
            </div>

            <div className="mt-4 lg:mt-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPresenca('vou')}
                  aria-pressed={presenca === 'vou'}
                  className={`h-[46px] rounded-[10px] border-[1.5px] text-[13px] font-bold transition-colors ${
                    presenca === 'vou'
                      ? 'border-primary bg-primary text-surface'
                      : 'border-field-border bg-surface text-muted'
                  }`}
                >
                  Vou
                </button>
                <button
                  type="button"
                  onClick={() => setPresenca('nao')}
                  aria-pressed={presenca === 'nao'}
                  className={`h-[46px] rounded-[10px] border-[1.5px] text-[13px] font-medium transition-colors ${
                    presenca === 'nao'
                      ? 'border-primary bg-primary text-surface'
                      : 'border-field-border bg-surface text-muted'
                  }`}
                >
                  Não vou
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <CampoTexto
                  name="presenca-nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <CampoTexto
                  name="presenca-acompanhantes"
                  placeholder="Acompanhantes: 0"
                  value={acompanhantes}
                  onChange={(e) => setAcompanhantes(e.target.value)}
                />
              </div>
              <CampoTexto
                className="mt-3"
                name="presenca-restricao"
                placeholder="Restrição alimentar? (opcional)"
                value={restricao}
                onChange={(e) => setRestricao(e.target.value)}
              />
              <Botao
                className="mt-4"
                icone={<img src={setaDireita} alt="" width={24} height={24} />}
              >
                Enviar confirmação
              </Botao>
            </div>
          </div>
        </section>

        {/* Presentes (faixa, grade 3 colunas) */}
        <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
          <div className={envoltorio}>
            <RotuloSecao className="text-center">PRESENTES</RotuloSecao>
            <h2 className={`mt-4 ${titulo} lg:text-center`}>Lista de presentes</h2>
            <p className="mt-1 text-[12px] text-muted lg:text-center lg:text-[14px]">
              Reserve um item ou contribua com uma cota.
            </p>
            <div className="mt-5 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-6">
              {presentes.length === 0 && <MensagemLista>Nenhum presente cadastrado ainda.</MensagemLista>}
              {presentes.slice(0, 3).map((p) => (
                <CartaoPresentePublico
                  key={p.id}
                  nome={p.nome}
                  preco={formatarMoeda(p.valorEstimado)}
                  imagem={p.foto ?? undefined}
                  status={
                    p.status === 'Disponivel'
                      ? { rotulo: 'Disponível', tom: 'sucesso' }
                      : { rotulo: 'Reservado', tom: 'neutro' }
                  }
                  acao={p.status === 'Disponivel' ? 'Reservar' : undefined}
                />
              ))}
            </div>
            {presentes.length > 3 && (
              <Botao
                className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
                icone={<img src={presenteBotao} alt="" width={24} height={24} />}
              >
                Todos presentes
              </Botao>
            )}
          </div>
        </section>

        {/* Presente em dinheiro / Pix (introdução | card) */}
        <section className="pt-10 lg:pt-16">
          <div className={`${duasColunas} lg:items-center`}>
            <div>
              <RotuloSecao className="text-center lg:text-left">
                PRESENTE EM DINHEIRO
              </RotuloSecao>
              <h2 className={`mt-4 ${titulo}`}>Prefere ajudar com Pix?</h2>
              <p className="mt-2 hidden text-[14px] text-muted lg:block">
                Contribua com qualquer valor e gere um QR Code na hora.
              </p>
            </div>
            <div className="mt-4 rounded-[12px] bg-heading p-5 lg:mt-0 lg:p-7">
              <p className="text-[13px] font-medium text-white">
                Digite o valor para gerar o QRcode
              </p>
              <CampoTexto
                className="mt-3"
                name="pix-valor"
                placeholder="R$: 50"
                value={valorPix}
                onChange={(e) => setValorPix(e.target.value)}
              />
              <Botao
                className="mt-3"
                icone={<img src={setaCheck} alt="" width={24} height={24} />}
              >
                Gerar QrCode
              </Botao>
            </div>
          </div>
        </section>

        {/* Mural de fotos */}
        <section className="mt-10 bg-badge py-10 lg:mt-16 lg:py-16">
          <div className={envoltorio}>
            <RotuloSecao className="lg:text-center">MURAL</RotuloSecao>
            <h2 className={`mt-4 ${titulo} lg:text-center`}>Fotos da festa</h2>
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
            <Botao
              className="mt-5 lg:mx-auto lg:mt-8 lg:max-w-xs"
              icone={<img src={setaDireita} alt="" width={24} height={24} />}
            >
              Enviar fotos
            </Botao>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="bg-primary-strong py-9 text-center lg:py-14">
          <p className="text-[14px] font-bold text-white lg:text-[18px]">{evento.nomeEvento}</p>
          <p className="mt-1 text-[12px] text-theme-lilac lg:text-[14px]">{dataPorExtenso}</p>
          <p className="mt-4 text-[11px] text-theme-lilac">
            Página criada com Dataê
          </p>
        </footer>

        {/* Navegação flutuante (só mobile; no desktop usa-se a barra lateral) */}
        <NavegacaoInferior
          className="mx-auto w-[min(100%-3rem,28rem)] lg:hidden"
          itens={navegacao}
        />
      </main>
    </div>
  )
}
