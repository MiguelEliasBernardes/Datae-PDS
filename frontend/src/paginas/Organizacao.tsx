import { useCallback, useState } from 'react'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { mensagemDeErro } from '../api/cliente'
import {
  desativarCodigoOrganizacao,
  gerarCodigoOrganizacao,
  obterOrganizacao,
  removerCoOrganizador,
  sairDaOrganizacao,
} from '../api/organizacao'
import type { Organizacao as DadosOrganizacao } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CartaoConvite } from '../componentes/CartaoConvite'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { SeloStatus } from '../componentes/SeloStatus'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarData } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/**
 * Organização de um evento que não é formatura: quem ajuda a organizar. O dono liga um código de convite
 * (link /convite/{codigo}); quem entra vira co-organizador e pode tudo no evento, menos excluí-lo e
 * mexer na organização. O dono remove pessoas; o co-organizador pode sair.
 */
export function Organizacao({
  eventoId,
  onVoltar,
  onSaiu,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  /** Depois que o co-organizador sai: o evento não é mais dele. */
  onSaiu: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterOrganizacao(eventoId), [eventoId])
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  // Cada alteração devolve a organização inteira: ela substitui a carregada
  const [atualizada, setAtualizada] = useState<DadosOrganizacao | null>(null)
  const organizacao = atualizada ?? dados

  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<number | null>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  async function executar(chave: string, acao: () => Promise<DadosOrganizacao>) {
    setErroAcao(null)
    setOcupado(chave)
    try {
      setAtualizada(await acao())
      setRemovendo(null)
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  async function sair() {
    setErroAcao(null)
    setOcupado('sair')
    try {
      await sairDaOrganizacao(eventoId)
      onSaiu()
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
      setOcupado(null)
    }
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  function conteudo() {
    if (!organizacao) {
      return (
        <>
          <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />
          {carregando && <MensagemLista>Carregando...</MensagemLista>}
        </>
      )
    }

    const { coOrganizadores, limiteCoOrganizadores, podeGerenciar, codigoConvite } = organizacao
    const completa = coOrganizadores.length >= limiteCoOrganizadores

    return (
      <div className="mt-5 mb-24 flex flex-col gap-6 lg:mb-0 lg:max-w-2xl">
        <AvisoErro mensagem={erroAcao} />

        {/* Convite (só o dono) */}
        {podeGerenciar && (
          <section className="flex flex-col gap-2 rounded-[12px] border-[1.5px] border-field-border p-4">
            <span className="font-display text-[14px] font-semibold text-primary-strong">Convidar para a organização</span>
            <p className="font-display text-[12px] text-muted">
              {completa
                ? `A organização já tem ${limiteCoOrganizadores} pessoas, o máximo. Remova alguém para convidar outra pessoa.`
                : codigoConvite
                  ? 'Mande o link ou o código para quem vai ajudar. Quem entrar pode cuidar de tudo no evento, menos excluí-lo e mexer na organização. Troque ou desligue o código se ele for parar em quem não deve.'
                  : 'Ligue um código de convite e mande o link para quem vai ajudar a organizar (padrinhos, família, amigos).'}
            </p>
            {codigoConvite && <CartaoConvite codigo={codigoConvite} />}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Botao
                variante="secundario"
                tamanho="pequeno"
                carregando={ocupado === 'codigo'}
                disabled={ocupado !== null && ocupado !== 'codigo'}
                onClick={() => void executar('codigo', () => gerarCodigoOrganizacao(eventoId))}
              >
                {codigoConvite ? 'Gerar outro código' : 'Ligar código de convite'}
              </Botao>
              {codigoConvite && (
                <Botao
                  variante="perigo"
                  tamanho="pequeno"
                  carregando={ocupado === 'desligar'}
                  disabled={ocupado !== null && ocupado !== 'desligar'}
                  onClick={() => void executar('desligar', () => desativarCodigoOrganizacao(eventoId))}
                >
                  Desligar
                </Botao>
              )}
            </div>
          </section>
        )}

        {/* Quem organiza */}
        <section className="flex flex-col gap-3">
          <RotuloSecao>
            QUEM ORGANIZA ({coOrganizadores.length + 1} de {limiteCoOrganizadores + 1})
          </RotuloSecao>
          <ul className="flex flex-col gap-2">
            <li className="flex items-center justify-between gap-3 rounded-[12px] bg-badge px-4 py-3">
              <p className="min-w-0 truncate text-[14px] font-semibold text-heading">{organizacao.nomeDono}</p>
              <SeloStatus tom="admin">Criou o evento</SeloStatus>
            </li>
            {coOrganizadores.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-[12px] border-[1.5px] border-field-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-heading">{c.nome}</p>
                    <p className="truncate text-[12px] text-muted">
                      {c.email} · entrou em {formatarData(c.entrouEm)}
                    </p>
                  </div>
                  <SeloStatus tom="sucesso">Co-organizador</SeloStatus>
                </div>
                {podeGerenciar &&
                  (removendo === c.id ? (
                    <div className="flex flex-col gap-2 rounded-[10px] bg-danger-bg p-3">
                      <p className="text-[12px] text-danger">
                        Remover {c.nome} da organização? O evento some de "Meus Eventos" dessa pessoa.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Botao tamanho="pequeno" variante="secundario" disabled={ocupado !== null} onClick={() => setRemovendo(null)}>
                          Cancelar
                        </Botao>
                        <Botao
                          tamanho="pequeno"
                          variante="perigo"
                          carregando={ocupado === `remover-${c.id}`}
                          onClick={() => void executar(`remover-${c.id}`, () => removerCoOrganizador(eventoId, c.id))}
                        >
                          Remover
                        </Botao>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRemovendo(c.id)}
                      className="self-start text-[12px] font-medium text-danger underline"
                    >
                      Remover da organização
                    </button>
                  ))}
              </li>
            ))}
          </ul>
          {coOrganizadores.length === 0 && (
            <MensagemLista>
              {podeGerenciar ? 'Ninguém entrou na organização ainda.' : 'Só você e quem criou o evento.'}
            </MensagemLista>
          )}
        </section>

        {/* O co-organizador pode sair */}
        {!podeGerenciar && (
          <section className="flex flex-col gap-2 lg:max-w-xs">
            {confirmandoSaida ? (
              <>
                <p className="text-[12px] text-danger">
                  Sair da organização? O evento some de "Meus Eventos". Para voltar, você vai precisar de um novo convite.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Botao variante="secundario" disabled={ocupado === 'sair'} onClick={() => setConfirmandoSaida(false)}>
                    Cancelar
                  </Botao>
                  <Botao variante="perigo" carregando={ocupado === 'sair'} onClick={() => void sair()}>
                    Sair
                  </Botao>
                </div>
              </>
            ) : (
              <Botao variante="perigo" onClick={() => setConfirmandoSaida(true)}>
                Sair da organização
              </Botao>
            )}
          </section>
        )}
      </div>
    )
  }

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />
      <TituloDestaque>Organização</TituloDestaque>
      <p className="mt-2 font-display text-[12px] text-muted lg:text-[13px]">
        Quem ajuda a organizar o evento. Todos cuidam de convidados, presentes, mural, página, checklist e Pix; só quem
        criou o evento pode excluí-lo e convidar ou remover pessoas.
      </p>
      {conteudo()}
    </LayoutPainel>
  )
}
