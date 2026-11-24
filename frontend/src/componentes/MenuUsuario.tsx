import { useCallback, useEffect, useRef, useState } from 'react'
import iconeUsuario from '../assets/circle-user.svg'
import type { Usuario } from '../api/tipos'
import { FormularioConta } from './FormularioConta'
import { JanelaModal } from './JanelaModal'

/**
 * Ícone do usuário logado (canto superior direito de "Meus Eventos"). Abre um menu com o nome,
 * o e-mail, "Minha conta" (editar nome, e-mail e senha) e "Sair".
 */
export function MenuUsuario({
  usuario,
  onAtualizado,
  onSair,
}: {
  usuario: Usuario
  onAtualizado: (usuario: Usuario) => void
  onSair: () => void
}) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [contaAberta, setContaAberta] = useState(false)
  const areaMenu = useRef<HTMLDivElement>(null)
  const fecharConta = useCallback(() => setContaAberta(false), [])

  // Fecha o menu ao clicar fora dele ou com Esc
  useEffect(() => {
    if (!menuAberto) return
    const aoClicar = (e: MouseEvent) => {
      if (!areaMenu.current?.contains(e.target as Node)) setMenuAberto(false)
    }
    const aoPressionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    window.addEventListener('keydown', aoPressionar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      window.removeEventListener('keydown', aoPressionar)
    }
  }, [menuAberto])

  return (
    <div ref={areaMenu} className="relative">
      <button
        type="button"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-label="Minha conta"
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-badge"
      >
        <img src={iconeUsuario} alt="" width={28} height={28} />
      </button>

      {menuAberto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-[14px] border-[1.5px] border-field-border bg-surface p-2 shadow-[0px_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="border-b border-field-border px-3 pt-1 pb-3">
            <p className="truncate text-[14px] font-semibold text-heading">{usuario.nome}</p>
            <p className="truncate text-[12px] text-muted">{usuario.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuAberto(false)
              setContaAberta(true)
            }}
            className="mt-1 w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-heading hover:bg-badge"
          >
            Minha conta
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onSair}
            className="w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-danger hover:bg-danger-bg"
          >
            Sair
          </button>
        </div>
      )}

      <JanelaModal titulo="Minha conta" aberta={contaAberta} onFechar={fecharConta}>
        {contaAberta && <FormularioConta onSalvo={onAtualizado} />}
      </JanelaModal>
    </div>
  )
}
