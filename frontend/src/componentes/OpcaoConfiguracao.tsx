import { useState } from 'react'
import { Interruptor } from './Interruptor'

interface OpcaoConfiguracaoProps {
  titulo: string
  descricao: string
  ativoInicialmente?: boolean
}

/** Linha de configuração opcional: título, descrição e interruptor. */
export function OpcaoConfiguracao({
  titulo,
  descricao,
  ativoInicialmente = false,
}: OpcaoConfiguracaoProps) {
  const [ativo, setAtivo] = useState(ativoInicialmente)
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="font-display text-[14px] font-semibold text-primary-strong">
          {titulo}
        </p>
        <p className="mt-1 font-display text-[10px] text-muted">{descricao}</p>
      </div>
      <Interruptor ativo={ativo} onAlterar={setAtivo} rotulo={titulo} />
    </div>
  )
}
