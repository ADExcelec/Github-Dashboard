import { useState } from 'react'
import { ProjectsList } from './components/ProjectsList'
import { PrdForm } from './components/PrdForm'
import './App.css'

function App() {
  const [view, setView] = useState<'dashboard' | 'prd'>('prd')

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>GitHub Delivery Console</h1>
        <nav>
          <button
            type="button"
            className={view === 'prd' ? 'is-active' : ''}
            onClick={() => setView('prd')}
          >
            Crear PRD
          </button>
          <button
            type="button"
            className={view === 'dashboard' ? 'is-active' : ''}
            onClick={() => setView('dashboard')}
          >
            Dashboard Projects
          </button>
        </nav>
      </header>

      {view === 'prd' ? <PrdForm /> : <ProjectsList />}
    </main>
  )
}

export default App
