import { useState, useMemo, useRef } from 'react'
import { calcTrade, fmtDate, fmtUsd } from '../utils/calc'
import { EMOTIONS } from '../utils/constants'

export default function TradeLog({ trades, onDelete, onClear, onEdit, setTab, exportJSON, importJSON, exportCSV }) {
  const [expanded, setExpanded] = useState(null)
  const [importMsg, setImportMsg] = useState('')
  const fileInputRef = useRef(null)

  const [resultFilter, setResultFilter] = useState('all') // all | win | loss | open
  const [pairFilter, setPairFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const withCalc = useMemo(() => trades.map(t => ({ ...t, ...calcTrade(t) })), [trades])

  const pairs = useMemo(() => [...new Set(trades.map(t => t.pair))].sort(), [trades])

  const needsOutcome = useMemo(
    () => withCalc.filter(t => t.result === 'open' && t.tp && t.sl),
    [withCalc]
  )

  const filtered = useMemo(() => {
    return withCalc.filter(t => {
      if (resultFilter !== 'all' && t.result !== resultFilter) return false
      if (pairFilter !== 'all' && t.pair !== pairFilter) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    })
  }, [withCalc, resultFilter, pairFilter, dateFrom, dateTo])

  const hasActiveFilters = resultFilter !== 'all' || pairFilter !== 'all' || dateFrom || dateTo

  function clearFilters() {
    setResultFilter('all')
    setPairFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const count = await importJSON(file)
      setImportMsg(`Imported ${count} trade${count !== 1 ? 's' : ''}.`)
    } catch (err) {
      setImportMsg(`Import failed: ${err.message}`)
    }
    e.target.value = ''
    setTimeout(() => setImportMsg(''), 4000)
  }

  if (trades.length === 0) {
    return (
      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl py-16 text-center">
        <p className="text-slate-500 text-sm">No trades yet.</p>
        <button onClick={() => setTab('add')} className="mt-3 text-cyan-400 text-sm hover:underline">
          Log your first trade →
        </button>
        {importJSON && (
          <div className="mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Or restore from backup
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">
          {filtered.length} of {trades.length} trade{trades.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          {exportCSV && (
            <button onClick={exportCSV} className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors">
              Export CSV
            </button>
          )}
          {exportJSON && (
            <button onClick={exportJSON} className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors">
              Backup
            </button>
          )}
          {importJSON && (
            <>
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors">
                Restore
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </>
          )}
          <button
            onClick={() => { if (confirm('Clear all trades?')) onClear() }}
            className="text-xs text-slate-500 hover:text-red-400 border border-[#1a2035] hover:border-red-800/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {importMsg && (
        <p className="text-xs text-cyan-400 bg-cyan-950/15 border border-cyan-800/20 rounded-lg px-3 py-2">
          {importMsg}
        </p>
      )}

      {needsOutcome.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-amber-400">
            {needsOutcome.length} trade{needsOutcome.length !== 1 ? 's' : ''} need{needsOutcome.length === 1 ? 's' : ''} a result — select Hit TP or Hit SL to include {needsOutcome.length === 1 ? 'it' : 'them'} in your stats.
          </p>
          <button
            onClick={() => onEdit(needsOutcome[0])}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Fix first one
          </button>
        </div>
      )}

      <div className="bg-[#0f1320] border border-[#1a2035] rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'win', label: 'Wins' },
            { key: 'loss', label: 'Losses' },
            { key: 'open', label: 'Open' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setResultFilter(opt.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                resultFilter === opt.key
                  ? opt.key === 'win'
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                    : opt.key === 'loss'
                    ? 'bg-red-950 border-red-700 text-red-400'
                    : 'bg-cyan-950 border-cyan-700 text-cyan-400'
                  : 'bg-transparent border-[#1a2035] text-slate-500 hover:border-[#2a3350]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pairFilter}
            onChange={e => setPairFilter(e.target.value)}
            className="bg-[#080b12] border border-[#1a2035] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-700/50"
          >
            <option value="all">All pairs</option>
            {pairs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-[#080b12] border border-[#1a2035] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-700/50"
          />
          <span className="text-xs text-slate-600">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-[#080b12] border border-[#1a2035] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-700/50"
          />

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-400 ml-auto">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl py-12 text-center">
          <p className="text-slate-500 text-sm">No trades match these filters.</p>
        </div>
      ) : (
        filtered.map(t => {
          const isOpen = expanded === t.id
          const emotion = EMOTIONS[(t.emotion || 3) - 1]
          const pnlColor = t.usd === null ? 'text-slate-500' : parseFloat(t.usd) >= 0 ? 'text-emerald-400' : 'text-red-400'

          return (
            <div key={t.id} className="bg-[#0f1320] border border-[#1a2035] rounded-xl overflow-hidden">
              <div
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-mono font-bold text-slate-100 text-sm w-20 shrink-0">{t.pair}</span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  t.dir === 'Buy' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                }`}>
                  {t.dir.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">{fmtDate(t.date)}</span>
                <span className="text-sm">{emotion.label}</span>
                <span className={`ml-auto font-mono font-semibold text-sm ${pnlColor}`}>{fmtUsd(t.usd)}</span>
                <span className="text-slate-600 text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-3 border-t border-[#1a2035] space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[['Entry', t.entry], ['Stop', t.sl], ['Target', t.tp], ['Lots', t.lots], ['Pips', t.pips], ['R:R', t.rr ? '1:' + t.rr : '—']].map(([label, val]) => (
                      <div key={label} className="bg-[#080b12] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="font-mono font-semibold text-slate-200 text-sm">{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {t.notes && (
                    <div className="bg-[#080b12] border border-[#1a2035] rounded-xl px-3.5 py-3 text-sm text-slate-400">
                      {t.notes}
                    </div>
                  )}
                  {t.img && (
                    <img
                      src={t.img}
                      alt="Chart screenshot"
                      className="rounded-xl border border-[#1a2035] max-h-64 object-contain w-full"
                    />
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(t)}
                      className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this trade?')) onDelete(t.id) }}
                      className="text-xs text-slate-500 hover:text-red-400 border border-[#1a2035] hover:border-red-800/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}