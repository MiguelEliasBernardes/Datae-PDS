import { Icone } from './Icone'
import type { ItemNavegacao } from './NavegacaoInferior'

/** Navegação lateral (somente desktop). No mobile usa-se a NavegacaoInferior. */
export function BarraLateral({ itens }: { itens: ItemNavegacao[] }) {
  return (
    // tema-padrao: o menu é do sistema, então não muda com a cor do evento na pré-visualização
    <aside className="tema-padrao sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-primary-strong px-4 py-7 lg:flex">
      <div className="mb-8 px-3 font-heading text-[24px] font-bold text-white">
        Dataê
      </div>
      <nav className="flex flex-col gap-1">
        {itens.filter((item) => item.ativo || item.onClick).map((item) => (
          <button
            key={item.rotulo}
            type="button"
            onClick={item.onClick}
            aria-current={item.ativo ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[14px] font-medium transition-colors ${
              item.ativo
                ? 'bg-surface text-primary-strong'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Icone src={item.icone} tamanho={22} />
            {item.rotulo}
          </button>
        ))}
      </nav>
    </aside>
  )
}
