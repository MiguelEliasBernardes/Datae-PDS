import { useCallback, useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { excluirPagamento, listarPagamentos, registrarPagamento } from '../api/formatura'
import type { RateioFormando } from '../api/tipos'
import { deCampoData, formatarData, formatarMoeda, lerValorMonetario } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { MensagemLista } from './MensagemLista'

/**
 * Conteúdo da janela de um formando no rateio: registrar um pagamento e ver
 * (ou desfazer) os já registrados. `onAlterado` avisa a tela para recalcular o rateio.
 * Com `somenteLeitura` (o próprio formando, sem ser do financeiro), só mostra o histórico.
 */
export function PagamentosFormando({
  eventoId,
  formando,
  somenteLeitura = false,
  onAlterado,
}: {
  eventoId: number
  formando: RateioFormando
  somenteLeitura?: boolean
  onAlterado: () => void
}) {
  const carregar = useCallback(() => listarPagamentos(eventoId, formando.formandoId), [eventoId, formando.formandoId])
  const { dados: pagamentos, erro: erroLista, carregando, recarregar } = useCarregamento(carregar)

  const restante = Math.max(0, formando.valorDevido - formando.valorPago)
  const [valor, setValor] = useState(restante > 0 ? restante.toFixed(2).replace('.', ',') : '')
  const [data, setData] = useState('')
  const [observacao, setObservacao] = useState('')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<number | null>(null)

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    const numero = lerValorMonetario(valor)

    // Validação no navegador, antes de chamar a API
    if (numero === null || Number.isNaN(numero) || numero <= 0) {
      setMensagemGeral('Informe um valor válido, ex.: 150 ou 150,50.')
      return
    }

    setErro(null)
    setMensagemGeral(null)
    setSalvando(true)
    try {
      await registrarPagamento(eventoId, formando.formandoId, {
        valor: numero,
        pagoEm: data ? deCampoData(data) : null,
        observacao,
      })
      setValor('')
      setData('')
      setObservacao('')
      recarregar()
      onAlterado()
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function desfazer(id: number) {
    setMensagemGeral(null)
    setExcluindo(id)
    try {
      await excluirPagamento(eventoId, formando.formandoId, id)
      recarregar()
      onAlterado()
    } catch (e) {
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted">
        Pagou {formatarMoeda(formando.valorPago)} de {formatarMoeda(formando.valorDevido)}
        {restante > 0 ? ` · faltam ${formatarMoeda(restante)}` : ' · quitado'}
      </p>

      {!somenteLeitura && (
        <form onSubmit={registrar} className="flex flex-col gap-3" noValidate>
          <AvisoErro mensagem={mensagemGeral} />
          <CampoTexto
            rotulo="Valor pago"
            inputMode="decimal"
            placeholder="Ex: 150,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            erro={erro?.doCampo('valor')}
          />
          <CampoTexto
            rotulo="Data do pagamento (opcional)"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            erro={erro?.doCampo('pagoEm')}
          />
          <AreaTexto
            rotulo="Observação (opcional)"
            placeholder="Ex: pagou em dinheiro"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            erro={erro?.doCampo('observacao')}
          />
          <Botao type="submit" carregando={salvando}>
            Registrar pagamento
          </Botao>
        </form>
      )}
      {somenteLeitura && <AvisoErro mensagem={mensagemGeral} />}

      <div className={`flex flex-col gap-2 ${somenteLeitura ? '' : 'border-t border-field-border pt-4'}`}>
        <span className="text-[13px] font-medium text-heading">Pagamentos registrados</span>
        <AvisoErro mensagem={erroLista} onTentarNovamente={recarregar} />
        {carregando && !pagamentos && <MensagemLista>Carregando pagamentos...</MensagemLista>}
        {pagamentos?.length === 0 && <MensagemLista>Nenhum pagamento registrado ainda.</MensagemLista>}
        {pagamentos?.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-2 border-b border-field-border pb-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-heading">
                {formatarMoeda(p.valor)} · {formatarData(p.pagoEm)}
              </p>
              {p.observacao && <p className="truncate font-display text-[12px] text-muted">{p.observacao}</p>}
            </div>
            {!somenteLeitura && (
              <button
                type="button"
                disabled={excluindo !== null}
                onClick={() => void desfazer(p.id)}
                className="shrink-0 text-[12px] font-medium text-danger disabled:opacity-60"
              >
                {excluindo === p.id ? 'Excluindo...' : 'Excluir'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
