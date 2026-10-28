import { FeatureCard, type FeatureCardProps } from './FeatureCard'

export type FeatureItem = Omit<FeatureCardProps, 'className'>

/**
 * Acessos rápidos. No mobile: grade 2×2 com divisórias verticais centrais.
 * No desktop: todos os cards numa linha.
 */
export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  const rows: FeatureItem[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2))

  return (
    <>
      {/* Mobile: linhas de 2 com divisória */}
      <div className="flex flex-col gap-5 lg:hidden">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-stretch">
            <FeatureCard className="flex-1" {...row[0]} />
            {row[1] && (
              <>
                <div className="mx-4 my-2 w-px self-stretch bg-field-border" />
                <FeatureCard className="flex-1" {...row[1]} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: uma linha */}
      <div
        className="hidden gap-6 lg:grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </div>
    </>
  )
}
