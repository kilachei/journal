import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useAuth } from './hooks/useAuth'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import LogTrade from './components/LogTrade'
import TradeLog from './components/TradeLog'
import Performance from './components/Performance'
import Auth from './components/Auth'
import { useTrades } from './hooks/useTrades'

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [editTrade, setEditTrade] = useState(null)
  const {
    trades, addTrade, updateTrade, deleteTrade, clearAll,
    exportJSON, importJSON, exportCSV,
    startingBalance, setStartingBalance,
  } = useTrades()

  function handleAdd(trade) {
    addTrade(trade)
    setTab('log')
  }

  function handleUpdate(id, trade) {
    updateTrade(id, trade)
    setEditTrade(null)
    setTab('log')
  }

  function handleEdit(trade) {
    setEditTrade(trade)
    setTab('add')
  }

  function handleCancelEdit() {
    setEditTrade(null)
    setTab('log')
  }

  function handleNavToAdd(targetTab) {
    if (targetTab === 'add') setEditTrade(null)
    setTab(targetTab)
  }

  // Show loading spinner while Firebase checks auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto">
            <span className="text-cyan-400 font-mono text-xs font-bold">KJ</span>
          </div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!user) return <Auth />

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-200">
      <Header
        tab={tab}
        setTab={handleNavToAdd}
        user={user}
        onSignOut={() => signOut(auth)}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'dashboard' && (
          <Dashboard
            trades={trades}
            setTab={handleNavToAdd}
            startingBalance={startingBalance}
            setStartingBalance={setStartingBalance}
          />
        )}
        {tab === 'add' && (
          <LogTrade
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            editTrade={editTrade}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {tab === 'log' && (
          <TradeLog
            trades={trades}
            onDelete={deleteTrade}
            onClear={clearAll}
            onEdit={handleEdit}
            setTab={handleNavToAdd}
            exportJSON={exportJSON}
            importJSON={importJSON}
            exportCSV={exportCSV}
          />
        )}
        {tab === 'stats' && <Performance trades={trades} />}
      </main>
    </div>
  )
}

export default App