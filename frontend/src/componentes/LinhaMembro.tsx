import lapis from '../assets/pencil.svg'
import type { PapelFormando } from '../api/tipos'
import { rotulosPapelFormando } from '../dados/formatacao'
import { SeloStatus, type TomSelo } from './SeloStatus'

const tomPapel: Record<PapelFormando, TomSelo> = {
  Membro: 'sucesso',
  Administrador: 'admin',
}

/** Linha de formando na lista (nome, papel e botão de editar). */
export function LinhaMembro({
  nome,
  papel,
  email,
  onEditar,
}: {
  nome: string
  papel: PapelFormando
  email?: string | null
  onEditar?: () => void
}) {
  return (
    <div className="border-b border-field-border pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-heading">{nome}</span>
          {email && <span className="block truncate font-display text-[12px] text-muted">{email}</span>}
        </div>
        <SeloStatus tom={tomPapel[papel]}>{rotulosPapelFormando[papel]}</SeloStatus>
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
