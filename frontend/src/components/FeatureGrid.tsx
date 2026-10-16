import { FeatureCard, type FeatureCardProps } from './FeatureCard'

export type FeatureItem = Omit<FeatureCardProps, 'className'>

/** Grade 2×2 de cards de acesso rápido, com divisórias verticais centrais. */
export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  const rows: FeatureItem[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2))

  return (
    <div className="flex flex-col gap-5">
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
  )
}
