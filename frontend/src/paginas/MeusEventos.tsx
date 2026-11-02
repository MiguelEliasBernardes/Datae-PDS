import { useCallback } from 'react'
import circuloMais from '../assets/circle-plus.svg'
import imagemFormatura from '../assets/event-formatura.png'
import imagemEvento from '../assets/event-marina-rafael.png'
import { listarEventos } from '../api/eventos'
import type { Evento } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { CartaoEvento } from '../componentes/CartaoEvento'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarData, rotulosTipoEvento } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/** Tela O2 - "Meus Eventos". */
export function MeusEventos({
  nomeUsuario,
  onCriar,
  onAcessarEvento,
  onSair,
}: {
  nomeUsuario?: string
  onCriar: () => void
  onAcessarEvento: (evento: Evento) => void
  onSair: () => void
}) {
  const carregar = useCallback(() => listarEventos(), [])
  const { dados: eventos, erro, carregando, recarregar } = useCarregamento(carregar)

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto w-full max-w-[402px] px-6 pt-12 pb-10 lg:max-w-5xl lg:px-10 lg:pt-16">
        {/* Usuário logado */}
        <div className="mb-6 flex items-center justify-between text-[13px] text-muted">
          <span>{nomeUsuario ? `Olá, ${nomeUsuario}` : ''}</span>
          <button type="button" onClick={onSair} className="font-medium text-primary">
            Sair
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TituloDestaque fonte="heading">Meus Eventos</TituloDestaque>
          <Botao
            className="lg:max-w-[220px]"
            onClick={onCriar}
            icone={<img src={circuloMais} alt="" width={24} height={24} />}
          >
            Criar Evento
          </Botao>
        </div>

        {/* Divisor (só mobile) */}
        <span className="mx-auto mt-4 block h-px w-3/5 bg-field-border lg:hidden" />

        <AvisoErro className="mt-6" mensagem={erro} onTentarNovamente={recarregar} />

        {/* Lista de eventos */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {carregando && !eventos && <MensagemLista>Carregando eventos...</MensagemLista>}
          {eventos?.length === 0 && (
            <MensagemLista>Você ainda não tem eventos. Clique em "Criar Evento" para começar.</MensagemLista>
          )}
          {eventos?.map((evento) => (
            <CartaoEvento
              key={evento.id}
              imagem={evento.tipo === 'Formatura' ? imagemFormatura : imagemEvento}
              titulo={evento.nomeEvento}
              data={formatarData(evento.dataEvento)}
              categoria={rotulosTipoEvento[evento.tipo]}
              onAcessar={() => onAcessarEvento(evento)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
