import { useState } from 'react'
import { CreateEvent } from './pages/CreateEvent'
import { Dashboard } from './pages/Dashboard'
import { EventLanding } from './pages/EventLanding'
import { EventPanel } from './pages/EventPanel'
import { Formandos } from './pages/Formandos'
import { FormaturaPanel } from './pages/FormaturaPanel'
import { Gifts } from './pages/Gifts'
import { Guests } from './pages/Guests'
import { Login } from './pages/Login'
import { PageSettings } from './pages/PageSettings'
import { Rateio } from './pages/Rateio'

type Screen =
  | 'login'
  | 'dashboard'
  | 'create'
  | 'event'
  | 'guests'
  | 'gifts'
  | 'settings'
  | 'landing'
  | 'formatura'
  | 'formandos'
  | 'rateio'

function renderScreen(
  screen: Screen,
  setScreen: (s: Screen) => void,
) {
  switch (screen) {
    case 'dashboard':
      return (
        <Dashboard
          onCreate={() => setScreen('create')}
          onAccessEvent={(event) =>
            setScreen(event.category === 'Formatura' ? 'formatura' : 'event')
          }
        />
      )
    case 'create':
      return <CreateEvent onBack={() => setScreen('dashboard')} />
    case 'event':
      return (
        <EventPanel
          onBack={() => setScreen('dashboard')}
          onOpenGuests={() => setScreen('guests')}
          onOpenGifts={() => setScreen('gifts')}
          onOpenSettings={() => setScreen('settings')}
          onOpenPreview={() => setScreen('landing')}
        />
      )
    case 'guests':
      return <Guests onBack={() => setScreen('event')} />
    case 'gifts':
      return <Gifts onBack={() => setScreen('event')} />
    case 'settings':
      return <PageSettings onBack={() => setScreen('event')} />
    case 'landing':
      return <EventLanding onBack={() => setScreen('event')} />
    case 'formatura':
      return (
        <FormaturaPanel
          onBack={() => setScreen('dashboard')}
          onOpenFormandos={() => setScreen('formandos')}
          onOpenRateio={() => setScreen('rateio')}
        />
      )
    case 'formandos':
      return <Formandos onBack={() => setScreen('formatura')} />
    case 'rateio':
      return <Rateio onBack={() => setScreen('formatura')} />
    default:
      return <Login onLogin={() => setScreen('dashboard')} />
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  return <div className="app-shell">{renderScreen(screen, setScreen)}</div>
}

export default App
