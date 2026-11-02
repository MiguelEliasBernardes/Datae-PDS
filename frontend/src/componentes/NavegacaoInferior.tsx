export interface ItemNavegacao {
  icone: string
  rotulo: string
  ativo?: boolean
  onClick?: () => void
}

/** Barra de navegação inferior flutuante do painel do evento. */
export function NavegacaoInferior({
  itens,
  className = '',
}: {
  itens: ItemNavegacao[]
  className?: string
}) {
  return (
    <nav
      className={`sticky bottom-4 mt-auto flex items-center gap-1 rounded-[30px] bg-primary-strong p-1.5 shadow-[0px_0px_5px_rgba(0,0,0,0.5)] ${className}`}
    >
      {itens.map((item) => (
        <button
          key={item.rotulo}
          type="button"
          onClick={item.onClick}
          aria-current={item.ativo ? 'page' : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-[26px] py-2 text-[10px] font-medium transition-colors ${
            item.ativo ? 'bg-surface text-primary-strong' : 'text-surface'
          }`}
        >
          <img src={item.icone} alt="" width={22} height={22} />
          {item.rotulo}
        </button>
      ))}
    </nav>
  )
}
