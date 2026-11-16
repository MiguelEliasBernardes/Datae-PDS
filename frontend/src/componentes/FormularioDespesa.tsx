import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { DadosDespesa, Despesa } from '../api/tipos'
import { deCampoData, lerValorMonetario, paraCampoData } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

/**
 * Formulário de adicionar/editar despesa da formatura. Quem chama decide o que fazer
 * ao salvar (criar ou atualizar na API); os erros da API aparecem nos campos.
 */
export function FormularioDespesa({
  despesa,
  onSalvar,
  onExcluir,
}: {
  despesa?: Despesa
  onSalvar: (dados: DadosDespesa) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor).replace('.', ',') : '')
  const [data, setData] = useState(despesa?.data ? paraCampoData(despesa.data) : '')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  async function executar(acao: () => Promise<void>) {
    setSalvando(true)
    setErro(null)
    setMensagemGeral(null)
    try {
      await acao()
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    const numero = lerValorMonetario(valor)

    // Validação no navegador, antes de chamar a API
    if (!descricao.trim()) {
      setMensagemGeral('Informe a descrição da despesa.')
      return
    }
    if (numero === null || Number.isNaN(numero) || numero <= 0) {
      setMensagemGeral('Informe um valor válido, ex.: 1500 ou 1.500,00.')
      return
    }

    void executar(() => onSalvar({ descricao, valor: numero, data: data ? deCampoData(data) : null }))
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <CampoTexto
        rotulo="Descrição"
        placeholder="Ex: Buffet, salão, fotógrafo"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        erro={erro?.doCampo('descricao')}
      />
      <CampoTexto
        rotulo="Valor"
        inputMode="decimal"
        placeholder="Ex: 1.500,00"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        erro={erro?.doCampo('valor')}
      />
      <CampoTexto
        rotulo="Data (opcional)"
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        erro={erro?.doCampo('data')}
      />

      <Botao type="submit" carregando={salvando}>
        {despesa ? 'Salvar alterações' : 'Adicionar despesa'}
      </Botao>

      {onExcluir &&
        (confirmandoExclusao ? (
          <div className="flex gap-2">
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
            <Botao type="button" variante="perigo" carregando={salvando} onClick={() => void executar(onExcluir)}>
              Confirmar exclusão
            </Botao>
          </div>
        ) : (
          <Botao type="button" variante="perigo" onClick={() => setConfirmandoExclusao(true)}>
            Excluir despesa
          </Botao>
        ))}
    </form>
  )
}
