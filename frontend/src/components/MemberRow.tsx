import pencil from '../assets/pencil.svg'
import { StatusBadge, type BadgeTone } from './StatusBadge'

export type MemberRole = 'membro' | 'administrador'

const roleInfo: Record<MemberRole, { tone: BadgeTone; label: string }> = {
  membro: { tone: 'success', label: 'Membro' },
  administrador: { tone: 'admin', label: 'Administrador' },
}

export interface Member {
  name: string
  role: MemberRole
}

/** Linha de formando na lista (nome, papel e botão de editar). */
export function MemberRow({
  name,
  role,
  onEdit,
}: Member & { onEdit?: () => void }) {
  const { tone, label } = roleInfo[role]
  return (
    <div className="border-b border-field-border pb-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{name}</span>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${name}`}
        className="mt-2 flex h-7 w-8 items-center justify-center rounded-[2px] bg-primary"
      >
        <img src={pencil} alt="" width={14} height={17} />
      </button>
    </div>
  )
}
