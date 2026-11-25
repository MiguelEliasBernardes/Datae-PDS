import { useCallback } from 'react'
import circuloMais from '../assets/circle-plus.svg'
import imagemFormatura from '../assets/event-formatura.png'
import imagemEvento from '../assets/event-marina-rafael.png'
import { urlApi } from '../api/cliente'
import { listarEventos } from '../api/eventos'
import type { Evento, Usuario } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { CartaoEvento } from '../componentes/CartaoEvento'
import { EntrarComCodigo } from '../componentes/EntrarComCodigo'
import { MensagemLista } from '../componentes/MensagemLista'
import { MenuUsuario } from '../componentes/MenuUsuario'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarData, rotulosPapelFormando, rotulosTipoEvento } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/** Tela O2 - "Meus Eventos". */
export function MeusEventos({
  usuario,
  onUsuarioAtualizado,
  onCriar,
  onAcessarEvento,
  onUsarCodigo,
  onSair,
}: {
  usuario: Usuario
  /** Depois de editar a conta (nome, e-mail ou senha). */
  onUsuarioAtualizado: (usuario: Usuario) => void
  onCriar: () => void
  onAcessarEvento: (evento: Evento) => void
  /** Abre a tela de aceitar convite com o código digitado. */
  onUsarCodigo: (codigo: string) => void
  onSair: () => void
}) {
  const carregar = useCallback(() => listarEventos(), [])
  const { dados: eventos, erro, carregando, recarregar } = useCarregamento(carregar)

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto w-full max-w-[402px] px-6 pt-12 pb-10 lg:max-w-5xl lg:px-10 lg:pt-16">
        {/* Usuário logado: o ícone abre o menu com "Minha conta" e "Sair" */}
        <div className="mb-6 flex items-center justify-between text-[13px] text-muted">
          <span>Olá, {usuario.nome}</span>
          <MenuUsuario usuario={usuario} onAtualizado={onUsuarioAtualizado} onSair={onSair} />
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

        {/* Entrar com o código do convite (organização de um evento ou comissão de formatura), para quem não recebeu o link */}
        <div className="mt-6">
          <EntrarComCodigo onUsarCodigo={onUsarCodigo} />
        </div>

        <AvisoErro className="mt-6" mensagem={erro} onTentarNovamente={recarregar} />

        {/* Lista de eventos */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {carregando && !eventos && <MensagemLista>Carregando eventos...</MensagemLista>}
          {eventos?.length === 0 && (
            <MensagemLista>
              Você ainda não tem eventos. Clique em "Criar Evento" para começar ou use um código de convite para
              ajudar a organizar um evento.
            </MensagemLista>
          )}
          {eventos?.map((evento) => (
            <CartaoEvento
              key={evento.id}
              imagem={
                evento.bannerUrl
                  ? urlApi(evento.bannerUrl)
                  : evento.tipo === 'Formatura'
                    ? imagemFormatura
                    : imagemEvento
              }
              titulo={evento.nomeEvento}
              data={formatarData(evento.dataEvento)}
              // Formatura em que a pessoa entrou por convite: mostra o papel dela na comissão
              categoria={
                evento.coOrganizador
                  ? `${rotulosTipoEvento[evento.tipo]} · Co-organizador`
                  : !evento.organizador && evento.meuPapel
                  ? `${rotulosTipoEvento[evento.tipo]} · ${rotulosPapelFormando[evento.meuPapel]}`
                  : rotulosTipoEvento[evento.tipo]
              }
              onAcessar={() => onAcessarEvento(evento)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
