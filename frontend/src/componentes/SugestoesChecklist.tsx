import { useCallback, useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { adicionarSugestoesChecklist, listarSugestoesChecklist } from '../api/checklist'
import type { Checklist } from '../api/tipos'
import { formatarMoeda, rotulosCategoriaChecklist } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { MensagemLista } from './MensagemLista'

/**
 * Sugestões do tipo do evento que ainda não estão na checklist (ex.: foram apagadas).
 * O organizador escolhe quais voltam; `onAdicionadas` recebe a checklist atualizada.
 */
export function SugestoesChecklist({
  eventoId,
  onAdicionadas,
}: {
  eventoId: number
  onAdicionadas: (checklist: Checklist) => void
}) {
  const carregar = useCallback(() => listarSugestoesChecklist(eventoId), [eventoId])
  const { dados: sugestoes, erro, carregando, recarregar } = useCarregamento(carregar)
  const [escolhidas, setEscolhidas] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  function alternar(chave: string) {
    setEscolhidas((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave)
      else nova.add(chave)
      return nova
    })
  }

  async function adicionar(chaves: string[]) {
    setErroSalvar(null)
    setSalvando(true)
    try {
      onAdicionadas(await adicionarSugestoesChecklist(eventoId, chaves))
    } catch (e) {
      setErroSalvar(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  if (!sugestoes) {
    return (
      <>
        <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando sugestões...</MensagemLista>}
      </>
    )
  }

  if (sugestoes.length === 0) {
    return <MensagemLista>Todas as sugestões para este tipo de evento já estão na sua checklist.</MensagemLista>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-muted">Escolha as sugestões que quer trazer de volta para a checklist.</p>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {sugestoes.map((s) => (
          <label key={s.chave} className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-field-border p-3">
            <input
              type="checkbox"
              checked={escolhidas.has(s.chave)}
              onChange={() => alternar(s.chave)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-heading">{s.titulo}</span>
              <span className="block font-display text-[11px] text-muted">
                {rotulosCategoriaChecklist[s.categoria]}
                {s.valorSugerido !== null && ` · ${formatarMoeda(s.valorSugerido)}`}
                {s.diasAntes !== null && ` · ${s.diasAntes === 0 ? 'no dia' : `${s.diasAntes} dias antes`}`}
              </span>
            </span>
          </label>
        ))}
      </div>
      <AvisoErro mensagem={erroSalvar} />
      <Botao disabled={escolhidas.size === 0} carregando={salvando} onClick={() => void adicionar([...escolhidas])}>
        Adicionar {escolhidas.size > 0 ? `(${escolhidas.size})` : 'selecionadas'}
      </Botao>
      <Botao variante="secundario" disabled={salvando} onClick={() => void adicionar([])}>
        Adicionar todas
      </Botao>
    </div>
  )
}
