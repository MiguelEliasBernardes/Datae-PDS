import { useEffect, useState } from 'react'
import { sair } from './api/autenticacao'
import { definirAoExpirarSessao } from './api/cliente'
import { obterUsuario } from './api/sessao'
import type { Evento, Usuario } from './api/tipos'
import { ConfiguracoesPagina } from './paginas/ConfiguracoesPagina'
import { Convidados } from './paginas/Convidados'
import { CriarEvento } from './paginas/CriarEvento'
import { Formandos } from './paginas/Formandos'
import { Login } from './paginas/Login'
import { MeusEventos } from './paginas/MeusEventos'
import { PaginaEvento } from './paginas/PaginaEvento'
import { PainelEvento } from './paginas/PainelEvento'
import { PainelFormatura } from './paginas/PainelFormatura'
import { Presentes } from './paginas/Presentes'
import { Rateio } from './paginas/Rateio'

type Tela =
  | 'login'
  | 'meus-eventos'
  | 'criar-evento'
  | 'painel-evento'
  | 'painel-formatura'
  | 'convidados'
  | 'presentes'
  | 'configuracoes'
  | 'pagina-evento'
  | 'formandos'
  | 'rateio'

/** Evento aberto no momento e qual painel ele usa (formatura tem um painel próprio). */
interface EventoAberto {
  id: number
  painel: 'painel-evento' | 'painel-formatura'
}

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(obterUsuario)
  const [tela, setTela] = useState<Tela>(() => (obterUsuario() ? 'meus-eventos' : 'login'))
  const [evento, setEvento] = useState<EventoAberto | null>(null)

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
    setEvento({ id: e.id, painel })
    setTela(painel)
  }

  function encerrarSessao() {
    sair()
    setUsuario(null)
    setEvento(null)
    setTela('login')
  }

  const irPara = (t: Tela) => () => setTela(t)

  function renderizarTela() {
    if (!usuario || tela === 'login') {
      return (
        <Login
          onEntrar={(u) => {
            setUsuario(u)
            setTela('meus-eventos')
          }}
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
          nomeUsuario={usuario.nome}
          onCriar={irPara('criar-evento')}
          onAcessarEvento={abrirEvento}
          onSair={encerrarSessao}
        />
      )
    }

    // Telas "dentro" de um evento
    const voltarAoPainel = irPara(evento.painel)
    const voltarAosEventos = () => {
      setEvento(null)
      setTela('meus-eventos')
    }

    switch (tela) {
      case 'painel-evento':
        return (
          <PainelEvento
            eventoId={evento.id}
            onVoltar={voltarAosEventos}
            onAbrirConvidados={irPara('convidados')}
            onAbrirPresentes={irPara('presentes')}
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
            onAbrirRateio={irPara('rateio')}
            onAbrirConfiguracoes={irPara('configuracoes')}
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
        return (
          <Presentes
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={irPara('configuracoes')}
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
          <PaginaEvento
            eventoId={evento.id}
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={irPara('configuracoes')}
          />
        )
      case 'formandos':
        return (
          <Formandos
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={irPara('configuracoes')}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
      case 'rateio':
        return (
          <Rateio
            onVoltar={voltarAoPainel}
            onAbrirConfiguracoes={irPara('configuracoes')}
            onAbrirVisualizacao={irPara('pagina-evento')}
          />
        )
    }
  }

  return <div className="app-shell">{renderizarTela()}</div>
}

export default App
