export interface CountdownUnit {
  value: string
  label: string
}

/** Contagem regressiva do evento, sobreposta ao banner. */
export function Countdown({ units }: { units: CountdownUnit[] }) {
  return (
    <div className="flex rounded-[12px] bg-white/25 px-2 py-2.5 backdrop-blur-sm">
      {units.map((u) => (
        <div key={u.label} className="flex-1 text-center text-white">
          <div className="text-[18px] font-bold">{u.value}</div>
          <div className="text-[11px]">{u.label}</div>
        </div>
      ))}
    </div>
  )
}
