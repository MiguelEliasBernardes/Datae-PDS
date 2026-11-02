import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { DadosPresente, Presente, StatusPresente } from '../api/tipos'
import { lerValorMonetario } from '../dados/formatacao'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { BotaoOpcao } from './BotaoOpcao'
import { CampoTexto } from './CampoTexto'

/**
 * Formulário de adicionar/editar presente. Quem chama decide o que fazer
 * ao salvar (criar ou atualizar na API); os erros da API aparecem nos campos.
 */
export function FormularioPresente({
  presente,
  onSalvar,
  onExcluir,
}: {
  presente?: Presente
  onSalvar: (dados: DadosPresente) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [nome, setNome] = useState(presente?.nome ?? '')
  const [descricao, setDescricao] = useState(presente?.descricao ?? '')
  const [valor, setValor] = useState(
    presente?.valorEstimado != null ? String(presente.valorEstimado).replace('.', ',') : '',
  )
  const [status, setStatus] = useState<StatusPresente>(presente?.status ?? 'Disponivel')
  const [link, setLink] = useState(presente?.linkAfiliado ?? '')
  const [foto, setFoto] = useState(presente?.foto ?? '')

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
    const valorEstimado = lerValorMonetario(valor)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) {
      setMensagemGeral('Informe o nome do presente.')
      return
    }
    if (valorEstimado !== null && (Number.isNaN(valorEstimado) || valorEstimado < 0)) {
      setMensagemGeral('Informe um valor válido, ex.: 199,90.')
      return
    }

    void executar(() =>
      onSalvar({
        nome,
        descricao,
        valorEstimado,
        linkAfiliado: link,
        foto,
        // Status só existe na edição; ao criar, o presente nasce disponível
        ...(presente ? { status } : {}),
      }),
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <CampoTexto
        rotulo="Nome"
        placeholder="Ex: Jogo de Panelas"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erro?.doCampo('nome')}
      />
      <CampoTexto
        rotulo="Valor estimado (opcional)"
        inputMode="decimal"
        placeholder="Ex: 199,90"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        erro={erro?.doCampo('valorEstimado')}
      />
      <AreaTexto
        rotulo="Descrição (opcional)"
        placeholder="Cor, modelo, tamanho..."
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        erro={erro?.doCampo('descricao')}
      />
      <CampoTexto
        rotulo="Link da loja (opcional)"
        type="url"
        placeholder="https://..."
        value={link}
        onChange={(e) => setLink(e.target.value)}
        erro={erro?.doCampo('linkAfiliado')}
      />
      <CampoTexto
        rotulo="Link da foto (opcional)"
        type="url"
        placeholder="https://..."
        value={foto}
        onChange={(e) => setFoto(e.target.value)}
        erro={erro?.doCampo('foto')}
      />

      {presente && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-heading">Situação</span>
          <div className="grid grid-cols-2 gap-2">
            <BotaoOpcao rotulo="Disponível" selecionado={status === 'Disponivel'} onClick={() => setStatus('Disponivel')} />
            <BotaoOpcao rotulo="Reservado" selecionado={status === 'Reservado'} onClick={() => setStatus('Reservado')} />
          </div>
          {erro?.doCampo('status') && <p className="text-[12px] text-danger">{erro.doCampo('status')}</p>}
        </div>
      )}

      <Botao type="submit" carregando={salvando}>
        {presente ? 'Salvar alterações' : 'Adicionar presente'}
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
            Excluir presente
          </Botao>
        ))}
    </form>
  )
}
