import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { DadosFormando, Formando, PapelFormando } from '../api/tipos'
import { rotulosPapelFormando } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { BotaoOpcao } from './BotaoOpcao'
import { CampoTexto } from './CampoTexto'

const papeis = Object.keys(rotulosPapelFormando) as PapelFormando[]

/**
 * Formulário de adicionar/editar formando. Quem chama decide o que fazer
 * ao salvar (criar ou atualizar na API); os erros da API aparecem nos campos.
 */
export function FormularioFormando({
  formando,
  onSalvar,
  onExcluir,
}: {
  formando?: Formando
  onSalvar: (dados: DadosFormando) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [nome, setNome] = useState(formando?.nome ?? '')
  const [email, setEmail] = useState(formando?.email ?? '')
  const [papel, setPapel] = useState<PapelFormando>(formando?.papel ?? 'Membro')

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

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) {
      setMensagemGeral('Informe o nome do formando.')
      return
    }

    void executar(() => onSalvar({ nome, email, papel }))
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <CampoTexto
        rotulo="Nome"
        placeholder="Nome do formando"
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
        <span className="text-[13px] font-medium text-heading">Papel na comissão</span>
        <div className="grid grid-cols-2 gap-2">
          {papeis.map((p) => (
            <BotaoOpcao key={p} rotulo={rotulosPapelFormando[p]} selecionado={papel === p} onClick={() => setPapel(p)} />
          ))}
        </div>
        {erro?.doCampo('papel') && <p className="text-[12px] text-danger">{erro.doCampo('papel')}</p>}
      </div>

      <Botao type="submit" carregando={salvando}>
        {formando ? 'Salvar alterações' : 'Adicionar formando'}
      </Botao>

      {onExcluir &&
        (confirmandoExclusao ? (
          <>
            <p className="text-[12px] text-danger">Os pagamentos registrados para este formando também serão apagados.</p>
            <div className="flex gap-2">
              <Botao type="button" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </Botao>
              <Botao type="button" variante="perigo" carregando={salvando} onClick={() => void executar(onExcluir)}>
                Confirmar exclusão
              </Botao>
            </div>
          </>
        ) : (
          <Botao type="button" variante="perigo" onClick={() => setConfirmandoExclusao(true)}>
            Excluir formando
          </Botao>
        ))}
    </form>
  )
}
