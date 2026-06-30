import { useState, useEffect } from 'react'

const KEY = 'kilachei_trades_v1'

export function useTrades() {
  const [trades, setTrades] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(trades))
  }, [trades])

  function addTrade(trade) {
    setTrades(ts => [{ ...trade, id: Date.now() }, ...ts])
  }

  function updateTrade(id, updatedTrade) {
    setTrades(ts => ts.map(t => (t.id === id ? { ...updatedTrade, id } : t)))
  }

  function deleteTrade(id) {
    setTrades(ts => ts.filter(t => t.id !== id))
  }

  function clearAll() {
    setTrades([])
  }

  return { trades, addTrade, updateTrade, deleteTrade, clearAll }
}