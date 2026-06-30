import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import LogTrade from './components/LogTrade'
import TradeLog from './components/TradeLog'
import Performance from './components/Performance'
import { useTrades } from './hooks/useTrades'

function App() {
  const [tab, setTab] = useState('dashboard')
  const { trades, addTrade, deleteTrade, clearAll } = useTrades()

  function handleAdd(trade) {
    addTrade(trade)
    setTab('log')
  }

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-200">
      <Header tab={tab} setTab={setTab} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'dashboard' && <Dashboard trades={trades} setTab={setTab} />}
        {tab === 'add' && <LogTrade onAdd={handleAdd} />}
        {tab === 'log' && <TradeLog trades={trades} onDelete={deleteTrade} onClear={clearAll} setTab={setTab} />}
        {tab === 'stats' && <Performance trades={trades} />}
      </main>
    </div>
  )
}

export default App