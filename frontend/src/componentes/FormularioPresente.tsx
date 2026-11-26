import { useEffect, useMemo, useState } from 'react'
import { ErroApi, mensagemDeErro, urlApi } from '../api/cliente'
import type { DadosPresente, Presente, StatusPresente } from '../api/tipos'
import type { AlteracaoFoto } from '../dados/fotoPresente'
import { lerValorMonetario, rotulosStatusPresente } from '../dados/formatacao'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { BotaoOpcao } from './BotaoOpcao'
import { CampoTexto } from './CampoTexto'
import { EnvioImagem } from './EnvioImagem'

const statusPresente = Object.keys(rotulosStatusPresente) as StatusPresente[]

/** O mesmo limite do backend. */
const TAMANHO_MAXIMO_FOTO_MB = 10

/**
 * Formulário de adicionar/editar presente. Quem chama decide o que fazer
 * ao salvar (criar ou atualizar na API, e depois enviar ou tirar a foto); os erros da API aparecem nos campos.
 * A foto escolhida só é enviada ao clicar em salvar.
 */
export function FormularioPresente({
  presente,
  onSalvar,
  onExcluir,
}: {
  presente?: Presente
  onSalvar: (dados: DadosPresente, foto: AlteracaoFoto) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [nome, setNome] = useState(presente?.nome ?? '')
  const [descricao, setDescricao] = useState(presente?.descricao ?? '')
  const [valor, setValor] = useState(
    presente?.valorEstimado != null ? String(presente.valorEstimado).replace('.', ',') : '',
  )
  const [status, setStatus] = useState<StatusPresente>(presente?.status ?? 'Disponivel')
  const [link, setLink] = useState(presente?.linkAfiliado ?? '')
  const [foto, setFoto] = useState<AlteracaoFoto>(null)
  const [cotas, setCotas] = useState(presente?.quantidadeCotas != null ? String(presente.quantidadeCotas) : '')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  // Prévia do arquivo escolhido, antes de enviar; o endereço temporário é liberado ao trocar ou fechar
  const previa = useMemo(() => (foto instanceof File ? URL.createObjectURL(foto) : null), [foto])
  useEffect(() => () => {
    if (previa) URL.revokeObjectURL(previa)
  }, [previa])

  const fotoExibida = foto === 'remover' ? null : (previa ?? (presente?.fotoUrl ? urlApi(presente.fotoUrl) : null))

  function escolherFoto(arquivo: File) {
    if (arquivo.size > TAMANHO_MAXIMO_FOTO_MB * 1024 * 1024) {
      setMensagemGeral(`A foto pode ter no máximo ${TAMANHO_MAXIMO_FOTO_MB} MB.`)
      return
    }
    setMensagemGeral(null)
    setFoto(arquivo)
  }

  function tirarFoto() {
    // Foto ainda não enviada: só desiste dela; foto já salva: é removida ao salvar
    setFoto(presente?.fotoUrl ? 'remover' : null)
  }

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
    const quantidadeCotas = cotas.trim() ? Number(cotas) : 0

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) {
      setMensagemGeral('Informe o nome do presente.')
      return
    }
    if (valorEstimado !== null && (Number.isNaN(valorEstimado) || valorEstimado < 0)) {
      setMensagemGeral('Informe um valor válido, ex.: 199,90.')
      return
    }
    if (quantidadeCotas !== 0 && (!Number.isInteger(quantidadeCotas) || quantidadeCotas < 2 || quantidadeCotas > 100)) {
      setMensagemGeral('Divida o presente em 2 a 100 cotas, ou deixe o campo vazio.')
      return
    }
    if (quantidadeCotas !== 0 && !valorEstimado) {
      setMensagemGeral('Informe o valor do presente para dividir em cotas.')
      return
    }

    void executar(() =>
      onSalvar(
        {
          nome,
          descricao,
          valorEstimado,
          linkAfiliado: link,
          quantidadeCotas,
          // Status só existe na edição de um presente inteiro; com cotas, ele é calculado pelo servidor
          ...(presente && quantidadeCotas === 0 && presente.quantidadeCotas === null ? { status } : {}),
        },
        foto,
      ),
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <AvisoErro mensagem={mensagemGeral} />

      <div className="flex flex-col items-center gap-1">
        <EnvioImagem
          rotulo={fotoExibida ? 'Trocar foto' : 'Foto (opcional)'}
          imagem={fotoExibida}
          carregando={salvando}
          onEscolher={escolherFoto}
          onRemover={tirarFoto}
        />
        {erro?.doCampo('arquivo') && <p className="text-[12px] text-danger">{erro.doCampo('arquivo')}</p>}
      </div>

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
      <div className="flex flex-col gap-1">
        <CampoTexto
          rotulo="Dividir em cotas (opcional)"
          type="number"
          min={2}
          max={100}
          placeholder="Ex: 10. Vazio = presente inteiro"
          value={cotas}
          onChange={(e) => setCotas(e.target.value)}
          erro={erro?.doCampo('quantidadeCotas')}
        />
        <p className="text-[12px] text-muted">
          Com cotas, vários convidados podem contribuir com partes do valor, pagando pelo Pix do evento.
        </p>
      </div>
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

      {presente && presente.quantidadeCotas === null && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-heading">Situação</span>
          <div className="grid grid-cols-3 gap-2">
            {statusPresente.map((s) => (
              <BotaoOpcao key={s} rotulo={rotulosStatusPresente[s]} selecionado={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
          {status === 'Disponivel' && presente.status !== 'Disponivel' && (
            <p className="text-[12px] text-muted">Ao salvar, a reserva do convidado é desfeita e o presente volta para a lista.</p>
          )}
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
