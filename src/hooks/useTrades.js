import { useState, useEffect } from 'react'
import { calcTrade } from '../utils/calc'

const KEY = 'kilachei_trades_v1'
const BALANCE_KEY = 'kilachei_balance_v1'
const LIMIT_KEY = 'kilachei_losslimit_v1'

export function useTrades() {
  const [trades, setTrades] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [startingBalance, setStartingBalanceState] = useState(() => {
    try {
      const stored = localStorage.getItem(BALANCE_KEY)
      return stored ? parseFloat(stored) : 0
    } catch {
      return 0
    }
  })

  const [lossLimitPct, setLossLimitPctState] = useState(() => {
    try {
      const stored = localStorage.getItem(LIMIT_KEY)
      return stored ? parseFloat(stored) : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(trades))
  }, [trades])

  useEffect(() => {
    localStorage.setItem(BALANCE_KEY, String(startingBalance))
  }, [startingBalance])

  useEffect(() => {
    localStorage.setItem(LIMIT_KEY, String(lossLimitPct))
  }, [lossLimitPct])

  function setStartingBalance(amount) {
    setStartingBalanceState(parseFloat(amount) || 0)
  }

  function setLossLimitPct(pct) {
    setLossLimitPctState(parseFloat(pct) || 0)
  }

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

  function exportJSON() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-journal-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const imported = JSON.parse(e.target.result)
          if (!Array.isArray(imported)) throw new Error('Invalid file: expected an array of trades')
          const withNewIds = imported.map(t => ({ ...t, id: t.id ?? Date.now() + Math.random() }))
          setTrades(ts => [...withNewIds, ...ts])
          resolve(withNewIds.length)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }

  function exportCSV() {
    const headers = ['date', 'time', 'pair', 'dir', 'entry', 'sl', 'tp', 'outcome', 'lots', 'pips', 'usd', 'rr', 'setup', 'session', 'emotion', 'notes']
    const rows = trades.map(t => {
      const calc = calcTrade(t)
      return headers.map(h => {
        if (h === 'pips') return calc.pips ?? ''
        if (h === 'usd') return calc.usd ?? ''
        if (h === 'rr') return calc.rr ?? ''
        const v = t[h] ?? ''
        return typeof v === 'string' && (v.includes(',') || v.includes('"'))
          ? `"${v.replace(/"/g, '""')}"`
          : v
      }).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-journal-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    trades, addTrade, updateTrade, deleteTrade, clearAll,
    exportJSON, importJSON, exportCSV,
    startingBalance, setStartingBalance,
    lossLimitPct, setLossLimitPct,
  }
}