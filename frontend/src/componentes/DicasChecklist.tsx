import { useState } from 'react'
import alerta from '../assets/message-square-warning.svg'
import type { AcaoDica, DicaChecklist } from '../api/tipos'

/**
 * Dicas calculadas a partir do estado do evento (lista vazia, Pix sem configurar, convidados
 * sem confirmar...). As pendentes aparecem com o botão que leva à tela que resolve; as já
 * resolvidas ficam recolhidas.
 */
export function DicasChecklist({
  dicas,
  acoes,
}: {
  dicas: DicaChecklist[]
  /** Tela aberta por cada ação; sem a ação, a dica aparece sem botão. */
  acoes: Partial<Record<AcaoDica, () => void>>
}) {
  const [verResolvidas, setVerResolvidas] = useState(false)
  const pendentes = dicas.filter((d) => !d.concluida)
  const resolvidas = dicas.filter((d) => d.concluida)

  if (dicas.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-[12px] bg-badge p-4 lg:max-w-3xl">
      <div className="flex items-center gap-2">
        <img src={alerta} alt="" width={20} height={20} />
        <span className="font-display text-[14px] font-semibold text-primary-strong">
          {pendentes.length > 0 ? 'Dicas para o seu evento' : 'Tudo em dia por aqui!'}
        </span>
      </div>

      {pendentes.map((d) => (
        <div key={d.chave} className="flex items-start justify-between gap-3 rounded-[10px] bg-surface p-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-heading">{d.titulo}</p>
            {d.descricao && <p className="mt-0.5 font-display text-[11px] text-muted">{d.descricao}</p>}
          </div>
          {acoes[d.acao] && (
            <button type="button" onClick={acoes[d.acao]} className="shrink-0 text-[12px] font-medium text-primary underline">
              Resolver
            </button>
          )}
        </div>
      ))}

      {resolvidas.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setVerResolvidas((atual) => !atual)}
            className="self-start text-[12px] font-medium text-muted underline"
          >
            {verResolvidas ? 'Esconder' : 'Ver'} {resolvidas.length === 1 ? '1 dica resolvida' : `${resolvidas.length} dicas resolvidas`}
          </button>
          {verResolvidas &&
            resolvidas.map((d) => (
              <p key={d.chave} className="font-display text-[12px] text-success">
                ✓ {d.titulo}
              </p>
            ))}
        </>
      )}
    </div>
  )
}
