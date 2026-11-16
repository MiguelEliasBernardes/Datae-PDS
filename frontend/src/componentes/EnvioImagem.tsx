import { useRef } from 'react'
import imagemMais from '../assets/image-plus.svg'

interface EnvioImagemProps {
  rotulo: string
  /** Imagem atual; sem ela, mostra o ícone de adicionar. */
  imagem?: string | null
  carregando?: boolean
  onEscolher: (arquivo: File) => void
  onRemover?: () => void
}

/** Área de upload de imagem (banner da página do evento). */
export function EnvioImagem({ rotulo, imagem, carregando = false, onEscolher, onRemover }: EnvioImagemProps) {
  const entrada = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          e.target.value = '' // permite escolher a mesma imagem de novo
          if (arquivo) onEscolher(arquivo)
        }}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={carregando}
        aria-label={imagem ? `Trocar ${rotulo.toLowerCase()}` : rotulo}
        aria-busy={carregando}
        className="flex h-[116px] w-[102px] items-center justify-center overflow-hidden rounded-[10px] bg-upload disabled:opacity-60"
      >
        {imagem ? (
          <img src={imagem} alt="" className="size-full object-cover" />
        ) : (
          <img src={imagemMais} alt="" width={68} height={68} />
        )}
      </button>
      <span className="font-display text-[14px] font-semibold text-primary-strong">
        {carregando ? 'Enviando...' : rotulo}
      </span>
      {imagem && onRemover && !carregando && (
        <button type="button" onClick={onRemover} className="text-[12px] font-medium text-danger">
          Remover imagem
        </button>
      )}
    </div>
  )
}
