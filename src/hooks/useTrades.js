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

  function deleteTrade(id) {
    setTrades(ts => ts.filter(t => t.id !== id))
  }

  function clearAll() {
    setTrades([])
  }

  return { trades, addTrade, deleteTrade, clearAll }
}