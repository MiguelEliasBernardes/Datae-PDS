import { useCallback, useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { excluirCota, listarCotas } from '../api/presentes'
import { formatarData, formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'
import { AvisoErro } from './AvisoErro'
import { MensagemLista } from './MensagemLista'

/**
 * Quem comprou cotas de um presente (aparece na janela de edição).
 * O organizador pode desfazer uma compra, por exemplo, se o convidado não pagou.
 */
export function ListaCotas({
  eventoId,
  presenteId,
  onAlterado,
}: {
  eventoId: number
  presenteId: number
  onAlterado: () => void
}) {
  const carregar = useCallback(() => listarCotas(eventoId, presenteId), [eventoId, presenteId])
  const { dados: cotas, erro, carregando, recarregar } = useCarregamento(carregar)
  const [excluindo, setExcluindo] = useState<number | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  async function desfazer(cotaId: number) {
    setErroExclusao(null)
    setExcluindo(cotaId)
    try {
      await excluirCota(eventoId, presenteId, cotaId)
      recarregar()
      onAlterado()
    } catch (e) {
      setErroExclusao(mensagemDeErro(e))
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-field-border pt-4">
      <span className="text-[13px] font-medium text-heading">Cotas compradas</span>
      <p className="text-[12px] text-muted">
        O Pix cai direto na sua conta: confira no extrato e desfaça as compras que não foram pagas.
      </p>
      <AvisoErro mensagem={erro ?? erroExclusao} onTentarNovamente={erro ? recarregar : undefined} />
      {carregando && !cotas && <MensagemLista>Carregando cotas...</MensagemLista>}
      {cotas?.length === 0 && <MensagemLista>Nenhuma cota comprada ainda.</MensagemLista>}
      {cotas?.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-2 border-b border-field-border pb-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-heading">{c.nomeConvidado}</p>
            <p className="font-display text-[12px] text-muted">
              {c.quantidade === 1 ? '1 cota' : `${c.quantidade} cotas`} · {formatarMoeda(c.valor)} · {formatarData(c.criadoEm)}
            </p>
          </div>
          <button
            type="button"
            disabled={excluindo !== null}
            onClick={() => void desfazer(c.id)}
            className="shrink-0 text-[12px] font-medium text-danger disabled:opacity-60"
          >
            {excluindo === c.id ? 'Desfazendo...' : 'Desfazer'}
          </button>
        </div>
      ))}
    </div>
  )
}
