import { useEffect, useState } from 'react'
import olho from './assets/eye.svg'
import casaBranca from './assets/house-white.svg'
import engrenagem from './assets/settings.svg'
import { sair } from './api/autenticacao'
import { definirAoExpirarSessao } from './api/cliente'
import { obterUsuario } from './api/sessao'
import type { AcaoDica, Evento, Permissao, Usuario } from './api/tipos'
import { codigoConviteDaUrl, limparUrl, rotaPublicaDaUrl } from './dados/rotas'
import { AceitarConvite } from './paginas/AceitarConvite'
import { Checklist } from './paginas/Checklist'
import { ConfiguracoesPagina } from './paginas/ConfiguracoesPagina'
import { Convidados } from './paginas/Convidados'
import { CriarEvento } from './paginas/CriarEvento'
import { Despesas } from './paginas/Despesas'
import { Formandos } from './paginas/Formandos'
import { Login } from './paginas/Login'
import { FinanceiroPix } from './paginas/FinanceiroPix'
import { MeusEventos } from './paginas/MeusEventos'
import { Mural } from './paginas/Mural'
import { PaginaEvento, PreVisualizacaoEvento } from './paginas/PaginaEvento'
import { PaginaFormando } from './paginas/PaginaFormando'
import { PainelEvento } from './paginas/PainelEvento'
import { PainelFormatura } from './paginas/PainelFormatura'
import { PaginaRecapitulacao } from './paginas/PaginaRecapitulacao'
import { PosEvento } from './paginas/PosEvento'
import { Presentes } from './paginas/Presentes'
import { Rateio } from './paginas/Rateio'
import { Roteiro } from './paginas/Roteiro'

type Tela =
  | 'login'
  | 'meus-eventos'
  | 'criar-evento'
  | 'painel-evento'
  | 'painel-formatura'
  | 'convidados'
  | 'presentes'
  | 'meus-presentes'
  | 'mural'
  | 'configuracoes'
  | 'pagina-evento'
  | 'formandos'
  | 'despesas'
  | 'rateio'
  | 'checklist'
  | 'pos-evento'
  | 'recapitulacao'
  | 'roteiro'
  | 'financeiro-pix'

/**
 * Evento aberto no momento, qual painel ele usa (formatura tem um painel próprio) e o que o
 * usuário pode fazer nele. As permissões só escondem botões: quem barra de verdade é o backend.
 */
interface EventoAberto {
  id: number
  painel: 'painel-evento' | 'painel-formatura'
  permissoes: Permissao[]
}

/**
 * Endereços /e/{slug} abrem a página pública do evento, /e/{slug}/{formando} a sub-página de
 * um formando e /e/{slug}/recapitulacao a recapitulação, para convidados (sem login).
 * Qualquer outro endereço abre a área do organizador.
 */
function App() {
  const rota = rotaPublicaDaUrl()
  if (rota?.recapitulacao) return <div className="app-shell"><PaginaRecapitulacao slug={rota.slug} /></div>
  if (rota?.slugFormando) {
    return <div className="app-shell"><PaginaFormando slug={rota.slug} slugFormando={rota.slugFormando} /></div>
  }
  if (rota) return <div className="app-shell"><PaginaEvento slug={rota.slug} /></div>
  return <AreaOrganizador />
}

function AreaOrganizador() {
  const [usuario, setUsuario] = useState<Usuario | null>(obterUsuario)
  const [tela, setTela] = useState<Tela>(() => (obterUsuario() ? 'meus-eventos' : 'login'))
  const [evento, setEvento] = useState<EventoAberto | null>(null)
  // Convite aberto por /convite/{codigo}: depois do login, a pessoa vê o convite antes de qualquer outra tela
  const [codigoConvite, setCodigoConvite] = useState(codigoConviteDaUrl)

  // Se a API responder 401 (token expirado), volta para o login
  useEffect(() => {
    definirAoExpirarSessao(() => {
      setUsuario(null)
      setEvento(null)
      setTela('login')
    })
    return () => definirAoExpirarSessao(null)
  }, [])

  function abrirEvento(e: Evento) {
    const painel = e.tipo === 'Formatura' ? 'painel-formatura' : 'painel-evento'
    setEvento({ id: e.id, painel, permissoes: e.permissoes })
    setTela(painel)
  }

  function encerrarSessao() {
    sair()
    setUsuario(null)
    setEvento(null)
    setTela('login')
  }

  function fecharConvite() {
    limparUrl()
    setCodigoConvite(null)
  }

  const irPara = (t: Tela) => () => setTela(t)

  function renderizarTela() {
    if (!usuario || tela === 'login') {
      return (
        <Login
          aviso={codigoConvite ? 'Entre ou crie sua conta para aceitar o convite da formatura.' : undefined}
          onEntrar={(u) => {
            setUsuario(u)
            setTela('meus-eventos')
          }}
        />
      )
    }

    if (codigoConvite) {
      return (
        <AceitarConvite
          codigo={codigoConvite}
          usuario={usuario}
          onAceito={(e) => {
            fecharConvite()
            abrirEvento(e)
          }}
          onIgnorar={() => {
            fecharConvite()
            setTela('meus-eventos')
          }}
          onTrocarConta={encerrarSessao}
        />
      )
    }

    // Telas que não dependem de um evento aberto
    if (tela === 'criar-evento') {
      return <CriarEvento onVoltar={irPara('meus-eventos')} onCriado={abrirEvento} />
    }
    if (!evento || tela === 'meus-eventos') {
      return (
        <MeusEventos
          usuario={usuario}
          onUsuarioAtualizado={setUsuario}
          onCriar={irPara('criar-evento')}
          onAcessarEvento={abrirEvento}
          onUsarCodigo={setCodigoConvite}
          onSair={encerrarSessao}
        />
      )
    }

    // Telas "dentro" de um evento
    const pode = (permissao: Permissao) => evento.permissoes.includes(permissao)
    const voltarAoPainel = irPara(evento.painel)
    const voltarAosEventos = () => {
      setEvento(null)
      setTela('meus-eventos')
    }
    // Sem permissão, o item "Configurações" some da navegação
    const abrirConfiguracoes = pode('GerenciarEvento') ? irPara('configuracoes') : undefined
    const formatura = evento.painel === 'painel-formatura'

    // Telas que resolvem cada dica da checklist (só as que o usuário pode abrir)
    const acoesDicas: Partial<Record<AcaoDica, () => void>> = {
      Configuracoes: abrirConfiguracoes,
      Presentes: pode('GerenciarEvento') && !formatura ? irPara('presentes') : undefined,
      MeusPresentes: formatura ? irPara('meus-presentes') : undefined,
      Convidados: pode('GerenciarEvento') ? irPara('convidados') : undefined,
      Mural: pode('ModerarMural') ? irPara('mural') : undefined,
      Formandos: pode('GerenciarComissao') ? irPara('formandos') : undefined,
      Despesas: formatura ? irPara('despesas') : undefined,
      Rateio: formatura ? irPara('rateio') : undefined,
      PosEvento: pode('GerenciarEvento') ? irPara('pos-evento') : undefined,
    }

    switch (tela) {
      case 'painel-evento':
        return (
          <PainelEvento
            eventoId={evento.id}
            onVoltar={voltarAosEventos}
            onAbrirConvidados={irPara('convidados')}
            onAbrirPresentes={irPara('presentes')}
            onAbrirMural={irPara('mural')}
            onAbrirChecklist={irPara('checklist')}
            onAbrirPosEvento={irPara('pos-evento')}
            onAbrirRoteiro={irPara('roteiro')}
            onAbrirFinanceiroPix={irPara('financeiro-pix')}
            onAbrirConfiguracoes={irPara('configuracoes')}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'painel-formatura':
        return (
          <PainelFormatura
            eventoId={evento.id}
            onVoltar={voltarAosEventos}
            onAbrirFormandos={irPara('formandos')}
            onAbrirDespesas={irPara('despesas')}
            onAbrirMural={irPara('mural')}
            onAbrirRateio={irPara('rateio')}
            onAbrirConvidados={irPara('convidados')}
            onAbrirMeusPresentes={irPara('meus-presentes')}
            onAbrirChecklist={irPara('checklist')}
            onAbrirPosEvento={irPara('pos-evento')}
            onAbrirRoteiro={irPara('roteiro')}
            onAbrirFinanceiroPix={irPara('financeiro-pix')}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'convidados':
        return (
          <Convidados
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={irPara('configuracoes')}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'presentes':
      case 'meus-presentes':
        return (
          <Presentes
            // key recria a tela ao trocar entre a lista do evento e a lista pessoal
            key={tela}
            eventoId={evento.id}
            minhaLista={tela === 'meus-presentes'}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'mural':
        return (
          <Mural
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'configuracoes':
        return (
          <ConfiguracoesPagina
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirVisualizacao={irPara('pagina-evento')}
            onExcluido={voltarAosEventos}
          />
        )
      case 'pagina-evento':
        return (
          <PreVisualizacaoEvento
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
          />
        )
      case 'formandos':
        return (
          <Formandos
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'despesas':
        return (
          <Despesas
            eventoId={evento.id}
            somenteLeitura={!pode('Financeiro')}
            onVoltar={voltarAoPainel}
            onAbrirRateio={irPara('rateio')}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'checklist':
        return (
          <Checklist
            eventoId={evento.id}
            podeEscolherResponsavel={formatura && pode('GerenciarComissao')}
            acoes={acoesDicas}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'financeiro-pix':
        return (
          <FinanceiroPix
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'roteiro':
        return (
          <Roteiro
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirChecklist={irPara('checklist')}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'pos-evento':
        return (
          <PosEvento
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirRecapitulacao={irPara('recapitulacao')}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'recapitulacao':
        return (
          <PaginaRecapitulacao
            eventoId={evento.id}
            navegacao={[
              { icone: casaBranca, rotulo: 'Inicio', onClick: voltarAoPainel },
              { icone: olho, rotulo: 'Pós-evento', onClick: irPara('pos-evento') },
              { icone: engrenagem, rotulo: 'Configurações', onClick: abrirConfiguracoes },
            ]}
          />
        )
      case 'rateio':
        return (
          <Rateio
            eventoId={evento.id}
            financeiro={pode('Financeiro')}
            onVoltar={voltarAoPainel}
            onAbrirDespesas={irPara('despesas')}
            onAbrirFormandos={pode('GerenciarComissao') ? irPara('formandos') : undefined}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
    }
  }

  return <div className="app-shell">{renderizarTela()}</div>
}

export default App
