import { useCallback, useState } from 'react'
import livroImagem from '../assets/book-image.svg'
import circuloCifrao from '../assets/circle-dollar-sign.svg'
import prancheta from '../assets/clipboard.svg'
import olho from '../assets/eye.svg'
import presente from '../assets/gift.svg'
import casa from '../assets/house.svg'
import emailConfirmado from '../assets/mail-check.svg'
import pacote from '../assets/package.svg'
import pix from '../assets/pix.svg'
import engrenagem from '../assets/settings.svg'
import compartilhar from '../assets/share-2.svg'
import pessoas from '../assets/users.svg'
import { listarConvidados } from '../api/convidados'
import { obterEvento } from '../api/eventos'
import { listarPresentes } from '../api/presentes'
import { AvisoErro } from '../componentes/AvisoErro'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { GradeAcessos } from '../componentes/GradeAcessos'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { useCarregamento } from '../hooks/useCarregamento'

/** Endereço público do evento (a página pública ainda não tem rota própria). */
const linkPublico = (slug: string) => `${window.location.origin}/${slug}`

/** Tela O4 - Painel do Evento. */
export function PainelEvento({
  eventoId,
  onVoltar,
  onAbrirConvidados,
  onAbrirPresentes,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirConvidados: () => void
  onAbrirPresentes: () => void
  onAbrirConfiguracoes: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(
    () => Promise.all([obterEvento(eventoId), listarConvidados(eventoId), listarPresentes(eventoId)]),
    [eventoId],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const [avisoLink, setAvisoLink] = useState<string | null>(null)

  const navegacao = [
    { icone: casa, rotulo: 'Inicio', ativo: true },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  if (!dados) {
    return (
      <LayoutPainel itens={navegacao}>
        <BotaoVoltar rotulo="Eventos" onVoltar={onVoltar} />
        <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando evento...</MensagemLista>}
      </LayoutPainel>
    )
  }

  const [evento, convidados, presentes] = dados
  const pessoasConfirmadas = convidados
    .filter((c) => c.statusPresenca === 'Confirmado')
    .reduce((total, c) => total + 1 + c.quantidadeAcompanhantes, 0)
  const reservados = presentes.filter((p) => p.status === 'Reservado').length
  const link = linkPublico(evento.slugPublico)

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link)
      setAvisoLink('Link copiado!')
    } catch {
      setAvisoLink('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  async function compartilharLink() {
    if (!navigator.share) {
      await copiarLink()
      return
    }
    try {
      await navigator.share({ title: evento.nomeEvento, url: link })
    } catch {
      // Usuário cancelou o compartilhamento: nada a fazer
    }
  }

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar rotulo="Eventos" onVoltar={onVoltar} />

      <TituloDestaque>{evento.nomeEvento}</TituloDestaque>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <CartaoEstatistica icone={emailConfirmado} valor={String(pessoasConfirmadas)} rotulo="Pessoas confirmadas" tom="lilas" />
        {/* O financeiro (PIX) ainda não tem backend */}
        <CartaoEstatistica icone={circuloCifrao} valor="—" rotulo="Dinheiro arrecadado" tom="menta" />
        <CartaoEstatistica icone={pacote} valor={`${reservados}/${presentes.length}`} rotulo="Itens reservados" tom="pessego" />
      </div>

      {/* Link para convidados */}
      <div className="mt-5 flex flex-col gap-2 lg:max-w-xl">
        <span className="font-display text-[14px] font-semibold text-primary-strong">
          Link para convidados
        </span>
        <div className="relative">
          <input
            readOnly
            value={link}
            aria-label="Link para convidados"
            onFocus={(e) => e.target.select()}
            className="h-[46px] w-full rounded-[10px] border-[1.5px] border-field-border bg-surface pr-20 pl-3 text-[12px] text-heading outline-none transition-colors focus:border-primary"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <button type="button" aria-label="Copiar link" onClick={() => void copiarLink()}>
              <img src={prancheta} alt="" width={24} height={24} />
            </button>
            <button type="button" aria-label="Compartilhar" onClick={() => void compartilharLink()}>
              <img src={compartilhar} alt="" width={28} height={28} />
            </button>
          </div>
        </div>
        {avisoLink && <span className="text-[12px] text-muted">{avisoLink}</span>}
      </div>

      {/* Acessos rápidos */}
      <div className="mt-6">
        <GradeAcessos
          itens={[
            { icone: pessoas, titulo: 'Convidados', onClick: onAbrirConvidados },
            { icone: presente, titulo: 'Presentes', onClick: onAbrirPresentes },
            { icone: livroImagem, titulo: 'Mural de fotos' },
            { icone: pix, titulo: 'Financeiro (PIX)' },
          ]}
        />
      </div>
    </LayoutPainel>
  )
}
