/** Caixa de erro geral (servidor fora do ar, sem permissão, etc.), com botão opcional de tentar de novo. */
export function AvisoErro({
  mensagem,
  onTentarNovamente,
  className = '',
}: {
  mensagem: string | null
  onTentarNovamente?: () => void
  className?: string
}) {
  if (!mensagem) return null
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-[10px] bg-danger-bg px-4 py-3 text-[13px] text-danger ${className}`}
    >
      <span>{mensagem}</span>
      {onTentarNovamente && (
        <button type="button" onClick={onTentarNovamente} className="shrink-0 font-semibold underline">
          Tentar novamente
        </button>
      )}
    </div>
  )
}
