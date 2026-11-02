import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { Convidado, DadosConvidado, StatusPresenca } from '../api/tipos'
import { rotulosStatusPresenca } from '../dados/formatacao'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { BotaoOpcao } from './BotaoOpcao'
import { CampoTexto } from './CampoTexto'

const statusPresenca = Object.keys(rotulosStatusPresenca) as StatusPresenca[]

/**
 * Formulário de adicionar/editar convidado. Quem chama decide o que fazer
 * ao salvar (criar ou atualizar na API); os erros da API aparecem nos campos.
 */
export function FormularioConvidado({
  convidado,
  onSalvar,
  onExcluir,
}: {
  convidado?: Convidado
  onSalvar: (dados: DadosConvidado) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [nome, setNome] = useState(convidado?.nome ?? '')
  const [email, setEmail] = useState(convidado?.email ?? '')
  const [status, setStatus] = useState<StatusPresenca>(convidado?.statusPresenca ?? 'Pendente')
  const [acompanhantes, setAcompanhantes] = useState(String(convidado?.quantidadeAcompanhantes ?? 0))
  const [observacao, setObservacao] = useState(convidado?.observacao ?? '')

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
    const quantidade = Number(acompanhantes)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) {
      setMensagemGeral('Informe o nome do convidado.')
      return
    }
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      setMensagemGeral('A quantidade de acompanhantes deve ser um número inteiro, 0 ou maior.')
      return
    }

    void executar(() =>
      onSalvar({
        nome,
        email,
        statusPresenca: status,
        quantidadeAcompanhantes: quantidade,
        observacao,
      }),
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <CampoTexto
        rotulo="Nome"
        placeholder="Nome do convidado"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erro?.doCampo('nome')}
      />
      <CampoTexto
        rotulo="E-mail (opcional)"
        type="email"
        placeholder="email@exemplo.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        erro={erro?.doCampo('email')}
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-heading">Presença</span>
        <div className="grid grid-cols-3 gap-2">
          {statusPresenca.map((s) => (
            <BotaoOpcao
              key={s}
              rotulo={rotulosStatusPresenca[s]}
              selecionado={status === s}
              onClick={() => setStatus(s)}
            />
          ))}
        </div>
      </div>

      <CampoTexto
        rotulo="Acompanhantes"
        type="number"
        min={0}
        value={acompanhantes}
        onChange={(e) => setAcompanhantes(e.target.value)}
        erro={erro?.doCampo('quantidadeAcompanhantes')}
      />
      <AreaTexto
        rotulo="Observação (opcional)"
        placeholder="Ex: restrição alimentar"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        erro={erro?.doCampo('observacao')}
      />

      <Botao type="submit" carregando={salvando}>
        {convidado ? 'Salvar alterações' : 'Adicionar convidado'}
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
            Excluir convidado
          </Botao>
        ))}
    </form>
  )
}
