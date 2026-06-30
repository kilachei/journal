import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTrade, fmtDate, fmtUsd } from '../utils/calc'
import { EMOTIONS } from '../utils/constants'

function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1 // week starts Monday
  d.setDate(d.getDate() - diff)
  return d.toISOString().split('T')[0]
}

export default function Dashboard({ trades, setTab, startingBalance, setStartingBalance, lossLimitPct, setLossLimitPct }) {
  const [selected, setSelected] = useState(null)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState(startingBalance || '')

  const withCalc = useMemo(() => trades.map(t => ({ ...t, ...calcTrade(t) })), [trades])
  const settled = withCalc.filter(t => t.result !== 'open')

  const totalUsd = settled.reduce((a, t) => a + parseFloat(t.usd), 0)
  const wins = settled.filter(t => t.result === 'win').length
  const winRate = settled.length ? Math.round((wins / settled.length) * 100) : null
  const avgRR = settled.filter(t => t.rr).length
    ? settled.filter(t => t.rr).reduce((a, t) => a + parseFloat(t.rr), 0) / settled.filter(t => t.rr).length
    : null

  const currentBalance = startingBalance + totalUsd
  const pctReturn = startingBalance > 0 ? (totalUsd / startingBalance) * 100 : null

  const today = new Date().toISOString().split('T')[0]
  const weekStart = getWeekStart(today)
  const todayPnl = settled.filter(t => t.date === today).reduce((a, t) => a + parseFloat(t.usd), 0)
  const weekPnl = settled.filter(t => t.date >= weekStart).reduce((a, t) => a + parseFloat(t.usd), 0)

  const limitBase = startingBalance > 0 ? startingBalance : null
  const todayLossPct = limitBase ? (-todayPnl / limitBase) * 100 : null
  const weekLossPct = limitBase ? (-weekPnl / limitBase) * 100 : null
  const todayBreached = lossLimitPct > 0 && todayLossPct !== null && todayLossPct >= lossLimitPct
  const weekBreached = lossLimitPct > 0 && weekLossPct !== null && weekLossPct >= lossLimitPct

  function saveBalance() {
    setStartingBalance(balanceInput)
    setEditingBalance(false)
  }

  const chartData = useMemo(() => {
    let cum = startingBalance || 0
    return [...settled].reverse().map(t => {
      cum += parseFloat(t.usd)
      return { date: fmtDate(t.date), cum: parseFloat(cum.toFixed(2)) }
    })
  }, [settled, startingBalance])

  const pnlColor = totalUsd > 0 ? 'text-emerald-400' : totalUsd < 0 ? 'text-red-400' : 'text-slate-300'
  const recent = withCalc.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Here's how your journal looks today.</p>
        </div>
        <button onClick={() => setTab('add')} className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-black font-semibold text-sm px-4 py-2 rounded-lg">
          + Log trade
        </button>
      </div>

      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        {editingBalance ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Starting balance</span>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={balanceInput}
              onChange={e => setBalanceInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveBalance()}
              className="bg-[#080b12] border border-[#1a2035] rounded-lg px-3 py-1.5 text-sm text-slate-200 font-mono outline-none focus:border-cyan-700/50 w-32"
              placeholder="1000"
            />
            <button onClick={saveBalance} className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Save
            </button>
            <button onClick={() => { setEditingBalance(false); setBalanceInput(startingBalance) }} className="text-xs text-slate-500 hover:text-slate-300 px-2">
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Account balance</p>
                <p className="font-mono font-semibold text-2xl text-slate-100">${currentBalance.toFixed(2)}</p>
              </div>
              {pctReturn !== null && (
                <span className={`font-mono text-sm font-semibold ${pctReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pctReturn >= 0 ? '+' : ''}{pctReturn.toFixed(2)}%
                </span>
              )}
            </div>
            <button
              onClick={() => { setBalanceInput(startingBalance); setEditingBalance(true) }}
              className="text-xs text-slate-500 hover:text-cyan-400 border border-[#1a2035] hover:border-cyan-800/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              {startingBalance > 0 ? 'Edit balance' : 'Set starting balance'}
            </button>
          </>
        )}
      </div>

      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Daily loss limit</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {startingBalance > 0
              ? "Get warned when today's or this week's losses cross this % of your balance."
              : 'Set a starting balance above to enable this.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            value={lossLimitPct || ''}
            onChange={e => setLossLimitPct(e.target.value)}
            placeholder="e.g. 5"
            disabled={startingBalance <= 0}
            className="bg-[#080b12] border border-[#1a2035] rounded-lg px-3 py-1.5 text-sm text-slate-200 font-mono outline-none focus:border-cyan-700/50 w-20 disabled:opacity-40"
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </div>

      {(todayBreached || weekBreached) && (
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl px-4 py-3 space-y-1">
          {todayBreached && (
            <p className="text-sm text-red-400">
              ⚠ Today's losses are {todayLossPct.toFixed(1)}% of your balance — over your {lossLimitPct}% daily limit. Consider stopping for today.
            </p>
          )}
          {weekBreached && (
            <p className="text-sm text-red-400">
              ⚠ This week's losses are {weekLossPct.toFixed(1)}% of your balance — over your {lossLimitPct}% weekly limit.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total P&L" value={settled.length ? fmtUsd(totalUsd) : '$0.00'} color={pnlColor} />
        <StatCard label="Win rate" value={winRate !== null ? winRate + '%' : '—'} />
        <StatCard label="Trades" value={trades.length} />
        <StatCard label="Avg R:R" value={avgRR ? '1:' + avgRR.toFixed(2) : '—'} color="text-cyan-400" small />
      </div>

      {chartData.length > 1 && (
        <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mb-4">
            {startingBalance > 0 ? 'Account balance over time' : 'Cumulative P&L'}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#0f1320', border: '1px solid #1a2035', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#06b6d4' }}
                formatter={v => ['$' + v, startingBalance > 0 ? 'Balance' : 'Cumulative P&L']}
              />
              <Area type="monotone" dataKey="cum" stroke="#06b6d4" strokeWidth={2} fill="url(#pnlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Recent trades</p>
          <button onClick={() => setTab('log')} className="text-xs text-cyan-400 hover:text-cyan-300">View all →</button>
        </div>
        {recent.length === 0 ? (
          <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl py-12 text-center">
            <p className="text-slate-500 text-sm">No trades yet.</p>
          </div>
        ) : (
          <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2035] bg-[#141826]">
                  {['Pair', 'Dir', 'Date', 'P&L', 'Mindset'].map(h => (
                    <th key={h} className="text-left text-[11px] text-slate-500 uppercase tracking-wider font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="border-b border-[#1a2035]/50 last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">{t.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${t.dir === 'Buy' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                        {t.dir.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{fmtDate(t.date)}</td>
                    <td className={`px-4 py-3 font-mono text-xs font-semibold ${parseFloat(t.usd) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtUsd(t.usd)}
                    </td>
                    <td className="px-4 py-3 text-sm">{EMOTIONS[(t.emotion || 3) - 1].label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-100 text-base">{selected.pair}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${selected.dir === 'Buy' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                  {selected.dir.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-mono">{fmtDate(selected.date)}</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-200 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                ['Entry', selected.entry], ['Stop', selected.sl], ['Target', selected.tp],
                ['Lots', selected.lots], ['Pips', selected.pips], ['R:R', selected.rr ? '1:' + selected.rr : '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-[#080b12] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-mono font-semibold text-slate-200 text-sm">{val || '—'}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between bg-[#080b12] rounded-lg px-3 py-2">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Result</span>
              <span className={`font-mono font-semibold text-sm ${parseFloat(selected.usd) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtUsd(selected.usd)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#080b12] rounded-lg px-3 py-2">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Mindset</span>
              <span className="text-sm">{EMOTIONS[(selected.emotion || 3) - 1].label}</span>
            </div>

            {selected.notes && (
              <div className="bg-[#080b12] border border-[#1a2035] rounded-xl px-3.5 py-3 text-sm text-slate-400">
                {selected.notes}
              </div>
            )}

            {selected.img && (
              <img
                src={selected.img}
                alt="Chart screenshot"
                className="rounded-xl border border-[#1a2035] max-h-72 object-contain w-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, small }) {
  return (
    <div className="bg-[#0f1320] border border-[#1a2035] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">{label}</span>
      <span className={`font-mono font-semibold ${small ? 'text-lg' : 'text-2xl'} ${color || 'text-slate-100'}`}>{value}</span>
    </div>
  )
}