import { useCallback, useState } from 'react'
import capelo from '../assets/graduation-cap.svg'
import pessoas from '../assets/users.svg'
import { mensagemDeErro } from '../api/cliente'
import { aceitarConvite, obterConvite } from '../api/convites'
import type { Evento, Usuario } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { Logo } from '../componentes/Logo'
import { MensagemLista } from '../componentes/MensagemLista'
import { formatarDataPorExtenso } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/**
 * Convite (aberto por /convite/{codigo} ou pelo código digitado em "Meus Eventos"), já com o usuário logado:
 * para ajudar a organizar um evento ou para a comissão de uma formatura. Mostra de que evento é o convite
 * e, ao aceitar, abre o painel do evento.
 */
export function AceitarConvite({
  codigo,
  usuario,
  onAceito,
  onIgnorar,
  onTrocarConta,
}: {
  codigo: string
  usuario: Usuario
  onAceito: (evento: Evento) => void
  onIgnorar: () => void
  onTrocarConta: () => void
}) {
  const carregar = useCallback(() => obterConvite(codigo), [codigo])
  const { dados: convite, erro, carregando } = useCarregamento(carregar)
  const [aceitando, setAceitando] = useState(false)
  const [erroAceite, setErroAceite] = useState<string | null>(null)

  async function aceitar() {
    setErroAceite(null)
    setAceitando(true)
    try {
      onAceito(await aceitarConvite(codigo))
    } catch (e) {
      setErroAceite(mensagemDeErro(e))
      setAceitando(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-12">
      <div className="flex w-full max-w-[402px] flex-col gap-5">
        <Logo />

        {carregando && !convite && <MensagemLista>Carregando convite...</MensagemLista>}
        <AvisoErro mensagem={erro} />

        {convite && (
          <div className="flex flex-col gap-4 rounded-[12px] bg-badge p-5">
            <img src={convite.tipo === 'Organizacao' ? pessoas : capelo} alt="" width={48} height={48} />
            <div>
              <p className="text-[13px] text-muted">
                {convite.tipo === 'Organizacao'
                  ? 'Você foi convidado para ajudar a organizar'
                  : 'Você foi convidado para a comissão da formatura'}
              </p>
              <h1 className="mt-1 font-heading text-[22px] font-bold text-heading">{convite.nomeEvento}</h1>
              <p className="mt-1 text-[13px] text-muted">{formatarDataPorExtenso(convite.dataEvento)}</p>
            </div>
            <p className="text-[13px] text-heading">
              {convite.tipo === 'Organizacao'
                ? 'Você vai poder cuidar dos convidados, dos presentes, do mural e da página do evento junto com quem o criou.'
                : convite.tipo === 'Formando'
                  ? `Você vai entrar como ${convite.nomeFormando}. O papel na comissão foi definido pelo organizador.`
                  : `Você vai entrar como formando, com o nome "${usuario.nome}". O organizador pode mudar seu papel depois.`}
            </p>
            <AvisoErro mensagem={erroAceite} />
            <Botao carregando={aceitando} onClick={() => void aceitar()}>
              {convite.tipo === 'Organizacao' ? 'Entrar na organização' : 'Entrar na formatura'}
            </Botao>
          </div>
        )}

        <p className="text-center text-[12px] text-muted">
          Conectado como {usuario.nome} ({usuario.email}).{' '}
          <button type="button" onClick={onTrocarConta} className="font-medium text-primary underline">
            Usar outra conta
          </button>
        </p>
        <Botao variante="secundario" onClick={onIgnorar}>
          {convite ? 'Agora não' : 'Ir para meus eventos'}
        </Botao>
      </div>
    </div>
  )
}
