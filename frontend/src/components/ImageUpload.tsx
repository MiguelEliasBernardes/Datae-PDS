import imagePlus from '../assets/image-plus.svg'

interface ImageUploadProps {
  label: string
  onClick?: () => void
}

/** Área de upload de imagem (banner da página do evento). */
export function ImageUpload({ label, onClick }: ImageUploadProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-[116px] w-[102px] items-center justify-center rounded-[10px] bg-upload"
      >
        <img src={imagePlus} alt="" width={68} height={68} />
      </button>
      <span className="font-display text-[14px] font-semibold text-primary-strong">
        {label}
      </span>
    </div>
  )
}
