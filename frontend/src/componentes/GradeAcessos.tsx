import { CartaoAcesso, type CartaoAcessoProps } from './CartaoAcesso'

export type ItemAcesso = Omit<CartaoAcessoProps, 'className'>

/**
 * Acessos rápidos. No mobile: grade 2×2 com divisórias verticais centrais.
 * No desktop: os cards numa linha (ou em linhas de 3, se forem mais de 4).
 */
export function GradeAcessos({ itens }: { itens: ItemAcesso[] }) {
  const linhas: ItemAcesso[][] = []
  for (let i = 0; i < itens.length; i += 2) linhas.push(itens.slice(i, i + 2))

  return (
    <>
      {/* Mobile: linhas de 2 com divisória */}
      <div className="flex flex-col gap-5 lg:hidden">
        {linhas.map((linha, indice) => (
          <div key={indice} className="flex items-stretch">
            <CartaoAcesso className="flex-1" {...linha[0]} />
            {linha[1] && (
              <>
                <div className="mx-4 my-2 w-px self-stretch bg-field-border" />
                <CartaoAcesso className="flex-1" {...linha[1]} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: uma linha */}
      <div
        className="hidden gap-6 lg:grid"
        style={{
          // Até 4 cards numa linha; com mais (painel da formatura), quebra em linhas de 3
          gridTemplateColumns: `repeat(${itens.length <= 4 ? itens.length : 3}, minmax(0, 1fr))`,
        }}
      >
        {itens.map((item) => (
          <CartaoAcesso key={item.titulo} {...item} />
        ))}
      </div>
    </>
  )
}
