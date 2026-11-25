import { useState } from 'react'
import type { PixInformado } from '../api/tipos'
import { formatarData, formatarMoeda } from '../dados/formatacao'
import { Botao } from './Botao'
import { SeloStatus } from './SeloStatus'

/**
 * Um Pix avisado por um convidado no relatório do organizador: quem mandou, o valor, de onde veio
 * (Pix livre ou cotas), o recado e as ações de conferir no extrato ou excluir.
 */
export function LinhaPixInformado({
  pix,
  ocupado,
  onAlternarConferido,
  onExcluir,
}: {
  pix: PixInformado
  ocupado: boolean
  onAlternarConferido: () => void
  onExcluir: () => void
}) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  return (
    <li className="flex flex-col gap-3 rounded-[12px] border-[1.5px] border-field-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-[14px] font-semibold text-heading">{pix.nomeConvidado}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {pix.origem === 'Cotas' ? 'Pix de cotas' : 'Presente em dinheiro'}
            {pix.detalhe && ` · ${pix.detalhe}`} · avisado em {formatarData(pix.informadoEm)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-heading text-[18px] font-bold text-heading">{formatarMoeda(pix.valor)}</span>
          {pix.conferido ? (
            <SeloStatus tom="sucesso">Conferido</SeloStatus>
          ) : (
            <SeloStatus tom="destaque">Aguardando conferência</SeloStatus>
          )}
        </div>
      </div>

      {pix.recado && (
        <p className="rounded-[10px] bg-badge p-3 text-[12px] whitespace-pre-line text-heading">“{pix.recado}”</p>
      )}

      {confirmandoExclusao ? (
        <div className="flex flex-col gap-2 rounded-[10px] bg-danger-bg p-3">
          <p className="text-[12px] text-danger">
            Excluir este aviso? Use quando o Pix não caiu no extrato ou foi avisado duas vezes.
            {pix.origem === 'Cotas' && ' A compra das cotas continua; para desfazê-la, use a lista de presentes.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Botao tamanho="pequeno" variante="secundario" disabled={ocupado} onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
            <Botao tamanho="pequeno" variante="perigo" carregando={ocupado} onClick={onExcluir}>
              Excluir
            </Botao>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Botao
            tamanho="pequeno"
            variante={pix.conferido ? 'secundario' : 'principal'}
            carregando={ocupado}
            onClick={onAlternarConferido}
          >
            {pix.conferido ? 'Desmarcar conferido' : 'Conferi no extrato'}
          </Botao>
          <Botao tamanho="pequeno" variante="perigo" disabled={ocupado} onClick={() => setConfirmandoExclusao(true)}>
            Excluir aviso
          </Botao>
        </div>
      )}
    </li>
  )
}
