import { useState, useMemo } from 'react'
import { calcTrade, fmtDate, fmtUsd } from '../utils/calc'
import { EMOTIONS } from '../utils/constants'

export default function TradeLog({ trades, onDelete, onClear, setTab }) {
  const [expanded, setExpanded] = useState(null)

  const withCalc = useMemo(() => trades.map(t => ({ ...t, ...calcTrade(t) })), [trades])

  if (trades.length === 0) {
    return (
      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl py-16 text-center">
        <p className="text-slate-500 text-sm">No trades yet.</p>
        <button onClick={() => setTab('add')} className="mt-3 text-cyan-400 text-sm hover:underline">
          Log your first trade →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">
          {trades.length} trade{trades.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => { if (confirm('Clear all trades?')) onClear() }}
          className="text-xs text-slate-500 hover:text-red-400 border border-[#1a2035] hover:border-red-800/40 px-3 py-1.5 rounded-lg transition-colors"
        >
          Clear all
        </button>
      </div>

      {withCalc.map(t => {
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
                <div className="flex justify-end">
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
      })}
    </div>
  )
}