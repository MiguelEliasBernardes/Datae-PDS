import imagemMais from '../assets/image-plus.svg'

interface EnvioImagemProps {
  rotulo: string
  onClick?: () => void
}

/** Área de upload de imagem (banner da página do evento). */
export function EnvioImagem({ rotulo, onClick }: EnvioImagemProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={rotulo}
        className="flex h-[116px] w-[102px] items-center justify-center rounded-[10px] bg-upload"
      >
        <img src={imagemMais} alt="" width={68} height={68} />
      </button>
      <span className="font-display text-[14px] font-semibold text-primary-strong">
        {rotulo}
      </span>
    </div>
  )
}
