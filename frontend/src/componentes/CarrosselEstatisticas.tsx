import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/** Tempo que cada card fica na tela antes de passar para o próximo. */
const INTERVALO_MS = 4000
/** Depois que a pessoa mexe no carrossel, ele espera este tempo antes de voltar a passar sozinho. */
const PAUSA_APOS_TOQUE_MS = 8000
/** Mesmo ponto de quebra do `lg:` do Tailwind: daqui para cima os cards viram grade. */
const CONSULTA_MOBILE = '(max-width: 1023px)'

/**
 * Cards de estatística: no mobile, um carrossel que passa sozinho de tempo em tempo (com os pontinhos
 * embaixo); no desktop, uma grade de 3 colunas. Para de passar enquanto a pessoa toca, passa o mouse
 * ou navega pelo teclado, e não se mexe sozinho para quem pede menos movimento (`prefers-reduced-motion`).
 */
export function CarrosselEstatisticas({ children, className = '' }: { children: ReactNode; className?: string }) {
  const trilho = useRef<HTMLDivElement>(null)
  const pausadoAte = useRef(0)
  const [pausadoPorFoco, setPausadoPorFoco] = useState(false)
  const [atual, setAtual] = useState(0)
  const [quantidade, setQuantidade] = useState(0)

  // Quantos cards existem (alguns aparecem só depois de carregar os dados)
  useEffect(() => {
    setQuantidade(trilho.current?.children.length ?? 0)
  }, [children])

  // Posição de rolagem que deixa o card no início da área visível (o trilho é `relative` e tem padding lateral)
  const posicaoDoCard = (el: HTMLDivElement, card: HTMLElement) =>
    card.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft)

  const irPara = useCallback((indice: number) => {
    const el = trilho.current
    const card = el?.children[indice] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: posicaoDoCard(el, card), behavior: 'smooth' })
  }, [])

  // Atualiza o pontinho ativo conforme a rolagem (automática ou com o dedo)
  function aoRolar() {
    const el = trilho.current
    if (!el || el.children.length === 0) return
    const inicio = el.scrollLeft
    let maisPerto = 0
    let menorDistancia = Infinity
    Array.from(el.children).forEach((card, i) => {
      const distancia = Math.abs(posicaoDoCard(el, card as HTMLElement) - inicio)
      if (distancia < menorDistancia) {
        menorDistancia = distancia
        maisPerto = i
      }
    })
    // No fim do trilho, o último card pode não chegar ao início da tela: conta como o último
    const noFim = inicio + el.clientWidth >= el.scrollWidth - 4
    setAtual(noFim ? el.children.length - 1 : maisPerto)
  }

  useEffect(() => {
    const mobile = window.matchMedia(CONSULTA_MOBILE)
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)')

    const intervalo = window.setInterval(() => {
      const el = trilho.current
      if (!el || !mobile.matches || menosMovimento.matches || pausadoPorFoco || document.hidden) return
      if (Date.now() < pausadoAte.current || el.children.length < 2) return
      // Só passa se houver algo escondido para o lado
      if (el.scrollWidth <= el.clientWidth + 4) return

      const noFim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      irPara(noFim ? 0 : atual + 1)
    }, INTERVALO_MS)

    return () => window.clearInterval(intervalo)
  }, [atual, pausadoPorFoco, irPara])

  const pausarPorToque = () => {
    pausadoAte.current = Date.now() + PAUSA_APOS_TOQUE_MS
  }

  return (
    <div className={className}>
      <div
        ref={trilho}
        onScroll={aoRolar}
        onPointerDown={pausarPorToque}
        onTouchStart={pausarPorToque}
        onWheel={pausarPorToque}
        onMouseEnter={() => setPausadoPorFoco(true)}
        onMouseLeave={() => setPausadoPorFoco(false)}
        onFocus={() => setPausadoPorFoco(true)}
        onBlur={() => setPausadoPorFoco(false)}
        className="relative -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden *:snap-start"
      >
        {children}
      </div>

      {/* Pontinhos (só no mobile): mostram em qual card está e levam direto a um deles */}
      {quantidade > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 lg:hidden">
          {Array.from({ length: quantidade }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Mostrar o card ${i + 1} de ${quantidade}`}
              aria-current={i === atual ? 'true' : undefined}
              onClick={() => {
                pausarPorToque()
                irPara(i)
              }}
              className={`h-1.5 rounded-full transition-all ${i === atual ? 'w-5 bg-primary' : 'w-1.5 bg-field-border'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
