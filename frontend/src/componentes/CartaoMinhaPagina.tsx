import { useCallback, useState } from 'react'
import { mensagemDeErro } from '../api/cliente'
import { obterEvento } from '../api/eventos'
import { atualizarMeuFormando, obterMeuFormando } from '../api/formatura'
import type { Formando } from '../api/tipos'
import { linkPaginaFormando } from '../dados/rotas'
import { useCarregamento } from '../hooks/useCarregamento'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'

/**
 * Sub-página pública do formando logado: o link para mandar aos convidados dele
 * e o recado que aparece no topo da página.
 */
export function CartaoMinhaPagina({ eventoId }: { eventoId: number }) {
  const carregar = useCallback(() => Promise.all([obterMeuFormando(eventoId), obterEvento(eventoId)]), [eventoId])
  const { dados, erro, recarregar } = useCarregamento(carregar)

  if (!dados) return <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />

  const [formando, evento] = dados
  // key recria o formulário com o recado salvo, se ele mudar
  return <ConteudoMinhaPagina key={formando.id} eventoId={eventoId} formando={formando} slugEvento={evento.slugPublico} />
}

function ConteudoMinhaPagina({
  eventoId,
  formando,
  slugEvento,
}: {
  eventoId: number
  formando: Formando
  slugEvento: string
}) {
  const link = linkPaginaFormando(slugEvento, formando.slug)
  const [mensagem, setMensagem] = useState(formando.mensagem ?? '')
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setErro(null)
    setAviso(null)
    setSalvando(true)
    try {
      await atualizarMeuFormando(eventoId, { mensagem })
      setAviso('Recado salvo.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setAviso('Link copiado!')
    } catch {
      setAviso('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border-[1.5px] border-field-border p-4 lg:max-w-xl">
      <span className="font-display text-[14px] font-semibold text-primary-strong">Minha página</span>
      <p className="font-display text-[11px] text-muted">
        Os presentes desta lista aparecem na sua página, dentro da página da formatura. Mande o link para os seus
        convidados.
      </p>
      <div className="flex items-center justify-between gap-2 rounded-[10px] bg-badge p-3">
        <a href={link} target="_blank" rel="noreferrer" className="min-w-0 truncate text-[12px] font-medium text-primary underline">
          {link}
        </a>
        <button type="button" onClick={() => void copiar()} className="shrink-0 text-[12px] font-medium text-primary underline">
          Copiar link
        </button>
      </div>
      <AreaTexto
        rotulo="Recado para os convidados (opcional)"
        placeholder="Ex: Obrigado por fazer parte dessa conquista!"
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
      />
      <AvisoErro mensagem={erro} />
      <div className="flex flex-col gap-2 lg:max-w-xs">
        <Botao variante="secundario" tamanho="pequeno" carregando={salvando} onClick={() => void salvar()}>
          Salvar recado
        </Botao>
        {aviso && (
          <span role="status" className="text-[12px] text-muted">
            {aviso}
          </span>
        )}
      </div>
    </div>
  )
}
