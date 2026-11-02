export interface UnidadeContagem {
  valor: string
  rotulo: string
}

/** Contagem regressiva do evento, sobreposta ao banner. */
export function ContagemRegressiva({ unidades }: { unidades: UnidadeContagem[] }) {
  return (
    <div className="flex rounded-[12px] bg-white/25 px-2 py-2.5 backdrop-blur-sm">
      {unidades.map((u) => (
        <div key={u.rotulo} className="flex-1 text-center text-white">
          <div className="text-[18px] font-bold">{u.valor}</div>
          <div className="text-[11px]">{u.rotulo}</div>
        </div>
      ))}
    </div>
  )
}
