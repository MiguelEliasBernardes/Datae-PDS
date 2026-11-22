import { useCallback } from 'react'
import notaDinheiro from '../assets/banknote-arrow-down.svg'
import livroImagem from '../assets/book-image.svg'
import circuloCheck from '../assets/circle-check-big.svg'
import prancheta from '../assets/clipboard.svg'
import olho from '../assets/eye.svg'
import presente from '../assets/gift.svg'
import casa from '../assets/house.svg'
import emailConfirmado from '../assets/mail-check.svg'
import obrigado from '../assets/gift-stat.svg'
import engrenagem from '../assets/settings.svg'
import dividir from '../assets/split.svg'
import pessoas from '../assets/users.svg'
import { obterEvento } from '../api/eventos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { GradeAcessos, type ItemAcesso } from '../componentes/GradeAcessos'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { rotulosPapelFormando } from '../dados/formatacao'
import { pode } from '../dados/permissoes'
import { linkPublicoEvento } from '../dados/rotas'
import { useCarregamento } from '../hooks/useCarregamento'

/**
 * Tela F1 - Painel da Formatura. Mostra só os módulos que o papel do usuário libera:
 * o organizador e os administradores veem tudo; o financeiro, despesas e o rateio completo;
 * a equipe de fotos, o mural; e todo formando vê a própria situação e a própria lista de presentes.
 */
export function PainelFormatura({
  eventoId,
  onVoltar,
  onAbrirFormandos,
  onAbrirDespesas,
  onAbrirMural,
  onAbrirRateio,
  onAbrirConvidados,
  onAbrirMeusPresentes,
  onAbrirChecklist,
  onAbrirPosEvento,
  onAbrirRoteiro,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirFormandos: () => void
  onAbrirDespesas: () => void
  onAbrirMural: () => void
  onAbrirRateio: () => void
  onAbrirConvidados: () => void
  onAbrirMeusPresentes: () => void
  onAbrirChecklist: () => void
  onAbrirPosEvento: () => void
  onAbrirRoteiro: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterEvento(eventoId), [eventoId])
  const { dados: evento, erro, recarregar } = useCarregamento(carregar)

  const navegacao = [
    { icone: casa, rotulo: 'Inicio', ativo: true },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  const acessos: ItemAcesso[] = []
  if (evento) {
    const financeiro = pode(evento, 'Financeiro')
    if (pode(evento, 'GerenciarComissao')) acessos.push({ icone: pessoas, titulo: 'Formandos', onClick: onAbrirFormandos })
    acessos.push({ icone: notaDinheiro, titulo: 'Despesas', onClick: onAbrirDespesas })
    acessos.push({ icone: dividir, titulo: financeiro ? 'Rateio Pagamentos' : 'Minha parte', onClick: onAbrirRateio })
    if (evento.meuPapel) acessos.push({ icone: presente, titulo: 'Meus presentes', onClick: onAbrirMeusPresentes })
    if (pode(evento, 'ModerarMural')) acessos.push({ icone: livroImagem, titulo: 'Mural de fotos', onClick: onAbrirMural })
    if (pode(evento, 'GerenciarEvento')) acessos.push({ icone: emailConfirmado, titulo: 'Convidados', onClick: onAbrirConvidados })
    acessos.push({ icone: circuloCheck, titulo: 'Checklist', onClick: onAbrirChecklist })
    if (pode(evento, 'GerenciarEvento')) acessos.push({ icone: prancheta, titulo: 'Roteiro com IA', onClick: onAbrirRoteiro })
    if (pode(evento, 'GerenciarEvento')) acessos.push({ icone: obrigado, titulo: 'Pós-evento', onClick: onAbrirPosEvento })
  }

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar rotulo="Eventos" onVoltar={onVoltar} />

      <TituloDestaque>{evento?.nomeEvento ?? 'Carregando...'}</TituloDestaque>

      {evento && (
        <p className="mt-2 font-display text-[12px] text-muted lg:text-[13px]">
          {evento.organizador
            ? evento.meuPapel
              ? `Você organiza esta formatura e também participa como ${rotulosPapelFormando[evento.meuPapel]}.`
              : 'Você organiza esta formatura.'
            : `Você participa da comissão como ${rotulosPapelFormando[evento.meuPapel ?? 'Membro']}.`}
        </p>
      )}

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Link para convidados */}
      <CampoTexto
        className="mt-5 lg:max-w-xl"
        rotulo="Link para convidados"
        tomRotulo="campo"
        name="link-publico"
        readOnly
        onFocus={(e) => e.target.select()}
        value={evento ? linkPublicoEvento(evento.slugPublico) : ''}
      />

      {/* Acessos rápidos */}
      <div className="mt-6">
        <GradeAcessos itens={acessos} />
      </div>
    </LayoutPainel>
  )
}
