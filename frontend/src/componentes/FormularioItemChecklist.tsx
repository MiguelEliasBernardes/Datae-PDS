import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { CategoriaChecklist, DadosItemChecklist, Formando, ItemChecklist } from '../api/tipos'
import { classeBorda, tonsRotulo } from '../dados/estilosCampo'
import { rotulosCategoriaChecklist } from '../dados/formatacao'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { BotaoOpcao } from './BotaoOpcao'
import { CampoTexto } from './CampoTexto'

const categorias = Object.keys(rotulosCategoriaChecklist) as CategoriaChecklist[]

/**
 * Formulário de adicionar/editar item da checklist. Quem chama decide o que fazer ao salvar;
 * os erros da API aparecem nos campos. `formandos` (só na formatura) permite escolher o responsável.
 */
export function FormularioItemChecklist({
  item,
  formandos,
  onSalvar,
  onExcluir,
}: {
  item?: ItemChecklist
  formandos?: Formando[]
  onSalvar: (dados: DadosItemChecklist) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? '')
  const [descricao, setDescricao] = useState(item?.descricao ?? '')
  const [categoria, setCategoria] = useState<CategoriaChecklist>(item?.categoria ?? 'Preparativos')
  const [diasAntes, setDiasAntes] = useState(item?.diasAntes != null ? String(item.diasAntes) : '')
  const [responsavel, setResponsavel] = useState(item?.responsavelFormandoId ? String(item.responsavelFormandoId) : '')

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
    const dias = diasAntes.trim() ? Number(diasAntes) : null

    // Validação no navegador, antes de chamar a API
    if (!titulo.trim()) {
      setMensagemGeral('Informe o que precisa ser feito.')
      return
    }
    if (dias !== null && (!Number.isInteger(dias) || dias < 0 || dias > 730)) {
      setMensagemGeral('O prazo deve ser de 0 a 730 dias antes do evento, ou vazio para sem prazo.')
      return
    }

    void executar(() =>
      onSalvar({
        titulo,
        descricao,
        categoria,
        // Na edição, campo vazio tira o prazo (-1) e o responsável (0); ao criar, basta não enviar
        diasAntes: dias ?? (item ? -1 : null),
        ...(formandos ? { responsavelFormandoId: responsavel ? Number(responsavel) : item ? 0 : null } : {}),
      }),
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <CampoTexto
        rotulo="O que precisa ser feito"
        placeholder="Ex: Reservar o salão"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        erro={erro?.doCampo('titulo')}
      />
      <AreaTexto
        rotulo="Detalhes (opcional)"
        placeholder="Contatos, valores, observações..."
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        erro={erro?.doCampo('descricao')}
      />

      <div className="flex flex-col gap-2">
        <span className={tonsRotulo.heading}>Categoria</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categorias.map((c) => (
            <BotaoOpcao key={c} rotulo={rotulosCategoriaChecklist[c]} selecionado={categoria === c} onClick={() => setCategoria(c)} />
          ))}
        </div>
        {erro?.doCampo('categoria') && <p className="text-[12px] text-danger">{erro.doCampo('categoria')}</p>}
      </div>

      <CampoTexto
        rotulo="Prazo: quantos dias antes do evento (opcional)"
        type="number"
        min={0}
        max={730}
        placeholder="Ex: 30. Vazio = sem prazo; 0 = no dia"
        value={diasAntes}
        onChange={(e) => setDiasAntes(e.target.value)}
        erro={erro?.doCampo('diasAntes')}
      />

      {formandos && (
        <label className="flex flex-col gap-2">
          <span className={tonsRotulo.heading}>Responsável (opcional)</span>
          <select
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className={`h-[46px] w-full rounded-[10px] border-[1.5px] bg-surface px-3 text-[13px] text-heading outline-none transition-colors ${classeBorda(erro?.doCampo('responsavelFormandoId'))}`}
          >
            <option value="">Ninguém</option>
            {formandos.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-muted">O responsável também pode marcar o item como feito.</span>
          {erro?.doCampo('responsavelFormandoId') && (
            <p className="text-[12px] text-danger">{erro.doCampo('responsavelFormandoId')}</p>
          )}
        </label>
      )}

      <Botao type="submit" carregando={salvando}>
        {item ? 'Salvar alterações' : 'Adicionar item'}
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
            Excluir item
          </Botao>
        ))}
    </form>
  )
}
