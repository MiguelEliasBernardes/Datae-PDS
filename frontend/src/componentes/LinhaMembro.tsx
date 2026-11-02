import lapis from '../assets/pencil.svg'
import { SeloStatus, type TomSelo } from './SeloStatus'

export type PapelMembro = 'membro' | 'administrador'

const infoPapel: Record<PapelMembro, { tom: TomSelo; rotulo: string }> = {
  membro: { tom: 'sucesso', rotulo: 'Membro' },
  administrador: { tom: 'admin', rotulo: 'Administrador' },
}

export interface Membro {
  nome: string
  papel: PapelMembro
}

/** Linha de formando na lista (nome, papel e botão de editar). */
export function LinhaMembro({
  nome,
  papel,
  onEditar,
}: Membro & { onEditar?: () => void }) {
  const { tom, rotulo } = infoPapel[papel]
  return (
    <div className="border-b border-field-border pb-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{nome}</span>
        <SeloStatus tom={tom}>{rotulo}</SeloStatus>
      </div>
      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar ${nome}`}
        className="mt-2 flex h-7 w-8 items-center justify-center rounded-[2px] bg-primary"
      >
        <img src={lapis} alt="" width={14} height={17} />
      </button>
    </div>
  )
}
