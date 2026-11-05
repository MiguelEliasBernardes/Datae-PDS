import { useState } from 'react'
import { mensagemDeErro, urlApi } from '../api/cliente'
import type { Foto, StatusFoto } from '../api/tipos'
import { formatarData, rotulosStatusFoto } from '../dados/formatacao'
import { Botao } from './Botao'
import { SeloStatus, type TomSelo } from './SeloStatus'

const tomStatus: Record<StatusFoto, TomSelo> = {
  Pendente: 'destaque',
  Aprovada: 'sucesso',
  Recusada: 'perigo',
}

/** Foto enviada por um convidado, com as ações de moderação do organizador. */
export function CartaoFotoModeracao({
  foto,
  onModerar,
  onExcluir,
}: {
  foto: Foto
  onModerar: (status: StatusFoto) => Promise<void>
  onExcluir: () => Promise<void>
}) {
  const [executando, setExecutando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  async function executar(chave: string, acao: () => Promise<void>) {
    setExecutando(chave)
    setErro(null)
    try {
      await acao()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setExecutando(null)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] bg-surface shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
      <a href={urlApi(foto.url)} target="_blank" rel="noreferrer" className="aspect-square bg-badge">
        <img src={urlApi(foto.url)} alt={foto.nomeAutor ? `Foto de ${foto.nomeAutor}` : 'Foto do mural'} loading="lazy" className="size-full object-cover" />
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-heading">{foto.nomeAutor ?? 'Anônimo'}</p>
            <p className="font-display text-[11px] text-muted">{formatarData(foto.enviadaEm)}</p>
          </div>
          <SeloStatus tom={tomStatus[foto.status]}>{rotulosStatusFoto[foto.status]}</SeloStatus>
        </div>

        {erro && <p role="alert" className="text-[12px] text-danger">{erro}</p>}

        <div className="mt-auto flex gap-2">
          {foto.status !== 'Aprovada' && (
            <Botao tamanho="pequeno" carregando={executando === 'aprovar'} onClick={() => void executar('aprovar', () => onModerar('Aprovada'))}>
              Aprovar
            </Botao>
          )}
          {foto.status !== 'Recusada' && (
            <Botao
              tamanho="pequeno"
              variante="secundario"
              carregando={executando === 'recusar'}
              onClick={() => void executar('recusar', () => onModerar('Recusada'))}
            >
              {foto.status === 'Aprovada' ? 'Ocultar' : 'Recusar'}
            </Botao>
          )}
        </div>

        {confirmandoExclusao ? (
          <div className="flex gap-2">
            <Botao tamanho="pequeno" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
            <Botao tamanho="pequeno" variante="perigo" carregando={executando === 'excluir'} onClick={() => void executar('excluir', onExcluir)}>
              Excluir
            </Botao>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmandoExclusao(true)} className="text-[12px] text-danger underline">
            Excluir foto
          </button>
        )}
      </div>
    </div>
  )
}
