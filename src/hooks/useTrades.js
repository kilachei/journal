import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, writeBatch, setDoc
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { calcTrade } from '../utils/calc'

const BALANCE_CACHE = 'kilachei_balance_cache'

export function useTrades() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState(null)

  // Load cached balance instantly on mount so there's no flicker
  const [startingBalance, setStartingBalanceState] = useState(() => {
    try {
      const cached = localStorage.getItem(BALANCE_CACHE)
      return cached ? parseFloat(cached) : 0
    } catch {
      return 0
    }
  })

  // Wait for Firebase auth to resolve
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUid(user ? user.uid : null)
      if (!user) {
        setStartingBalanceState(0)
        localStorage.removeItem(BALANCE_CACHE)
      }
    })
    return unsubscribe
  }, [])

  // Listen to trades
  useEffect(() => {
    if (!uid) {
      setTrades([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', uid, 'trades'),
      orderBy('created_at', 'desc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetched = snapshot.docs.map(d => ({ ...d.data(), id: d.id }))
      setTrades(fetched)
      setLoading(false)
    })

    return unsubscribe
  }, [uid])

  // Listen to starting balance from Firestore
  // Also write to localStorage cache every time it changes
  useEffect(() => {
    if (!uid) return

    const profileRef = doc(db, 'users', uid, 'profile', 'settings')

    const unsubscribe = onSnapshot(profileRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.startingBalance !== undefined) {
          const val = parseFloat(data.startingBalance) || 0
          setStartingBalanceState(val)
          localStorage.setItem(BALANCE_CACHE, String(val)) // cache it
        }
      }
    })

    return unsubscribe
  }, [uid])

  async function setStartingBalance(amount) {
    const parsed = parseFloat(amount) || 0
    setStartingBalanceState(parsed)
    localStorage.setItem(BALANCE_CACHE, String(parsed)) // cache immediately
    if (!uid) return
    const profileRef = doc(db, 'users', uid, 'profile', 'settings')
    await setDoc(profileRef, { startingBalance: parsed }, { merge: true })
  }

  async function addTrade(trade) {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'trades'), {
      ...trade,
      created_at: new Date().toISOString(),
    })
  }

  async function updateTrade(id, updatedTrade) {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'trades', id)
    await updateDoc(ref, { ...updatedTrade })
  }

  async function deleteTrade(id) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'trades', id))
  }

  async function clearAll() {
    if (!uid) return
    const batch = writeBatch(db)
    trades.forEach(t => {
      batch.delete(doc(db, 'users', uid, 'trades', t.id))
    })
    await batch.commit()
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
      reader.onload = async e => {
        try {
          if (!uid) throw new Error('Not logged in')
          const imported = JSON.parse(e.target.result)
          if (!Array.isArray(imported)) throw new Error('Invalid file: expected an array of trades')
          for (const t of imported) {
            await addDoc(collection(db, 'users', uid, 'trades'), {
              ...t,
              created_at: t.created_at || new Date().toISOString(),
            })
          }
          resolve(imported.length)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }

  function exportCSV() {
    const headers = ['date', 'time', 'pair', 'dir', 'entry', 'sl', 'tp', 'lots', 'pips', 'usd', 'rr', 'setup', 'session', 'emotion', 'notes']
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
    trades, loading, addTrade, updateTrade, deleteTrade, clearAll,
    exportJSON, importJSON, exportCSV,
    startingBalance, setStartingBalance,
  }
}