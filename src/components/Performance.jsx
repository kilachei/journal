import { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTrade, fmtUsd } from '../utils/calc'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0f1320', border: '1px solid #1a2035', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

function groupBy(settled, keyFn) {
  const map = {}
  settled.forEach(t => {
    const key = keyFn(t) || 'Other'
    if (!map[key]) map[key] = { key, pnl: 0, trades: 0, wins: 0 }
    map[key].pnl += parseFloat(t.usd)
    map[key].trades++
    if (t.result === 'win') map[key].wins++
  })
  return Object.values(map)
    .map(d => ({ ...d, winRate: d.trades ? Math.round((d.wins / d.trades) * 100) : 0 }))
    .sort((a, b) => b.pnl - a.pnl)
}

export default function Performance({ trades }) {
  const withCalc = useMemo(() => trades.map(t => ({ ...t, ...calcTrade(t) })), [trades])
  const settled = withCalc.filter(t => t.result !== 'open')

  const wins = settled.filter(t => t.result === 'win').length
  const losses = settled.filter(t => t.result === 'loss').length
  const overallWinRate = settled.length ? Math.round((wins / settled.length) * 100) : null
  const bestTrade = settled.length ? Math.max(...settled.map(t => parseFloat(t.usd))) : null
  const worstTrade = settled.length ? Math.min(...settled.map(t => parseFloat(t.usd))) : null

  const pairData    = useMemo(() => groupBy(settled, t => t.pair), [settled])
  const setupData   = useMemo(() => groupBy(settled, t => t.setup), [settled])
  const sessionData = useMemo(() => groupBy(settled, t => t.session), [settled])

  const emotionData = useMemo(() => {
    const labels = { 1: 'Fearful', 2: 'Anxious', 3: 'Neutral', 4: 'Confident', 5: 'Focused' }
    const map = { 1: { pnl: 0, trades: 0, wins: 0 }, 2: { pnl: 0, trades: 0, wins: 0 }, 3: { pnl: 0, trades: 0, wins: 0 }, 4: { pnl: 0, trades: 0, wins: 0 }, 5: { pnl: 0, trades: 0, wins: 0 } }
    settled.forEach(t => {
      const e = t.emotion || 3
      map[e].pnl += parseFloat(t.usd)
      map[e].trades++
      if (t.result === 'win') map[e].wins++
    })
    return Object.keys(map).map(k => ({
      label: labels[k],
      avg: map[k].trades ? parseFloat((map[k].pnl / map[k].trades).toFixed(2)) : 0,
      winRate: map[k].trades ? Math.round((map[k].wins / map[k].trades) * 100) : 0,
      trades: map[k].trades,
    }))
  }, [settled])

  if (trades.length === 0) {
    return (
      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl py-20 text-center">
        <p className="text-slate-500 text-sm">No trades yet — log some to see your performance.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Win rate" value={overallWinRate !== null ? overallWinRate + '%' : '—'} color="text-cyan-400" />
        <StatCard label="Wins / Losses" value={`${wins} / ${losses}`} />
        <StatCard label="Best trade" value={bestTrade !== null ? fmtUsd(bestTrade) : '—'} color="text-emerald-400" small />
        <StatCard label="Worst trade" value={worstTrade !== null ? fmtUsd(worstTrade) : '—'} color="text-red-400" small />
      </div>

      <BreakdownCard title="By pair" data={pairData} />
      <BreakdownCard title="By setup" data={setupData} />
      <BreakdownCard title="By session" data={sessionData} />

      <ChartCard title="Avg P&L by mindset">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={emotionData}>
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v, name, props) => [`$${v} · ${props.payload.winRate}% win rate · ${props.payload.trades} trades`, 'Avg P&L']}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {emotionData.map((d, i) => <Cell key={i} fill={d.avg >= 0 ? '#06b6d4' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
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

function ChartCard({ title, children }) {
  return (
    <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5">
      <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mb-4">{title}</p>
      {children}
    </div>
  )
}

// Combined P&L bar chart + win-rate-per-row table, since a bar chart alone can't show
// two numbers (P&L and win rate) at once without becoming cluttered.
function BreakdownCard({ title, data }) {
  if (data.length === 0) return null

  return (
    <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5">
      <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
          <YAxis type="category" dataKey="key" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v, name, props) => [`$${v} · ${props.payload.winRate}% win rate · ${props.payload.trades} trades`, 'P&L']}
          />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-1.5">
        {data.map(d => (
          <div key={d.key} className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium">{d.key}</span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-500">{d.trades} trades</span>
              <span className={d.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{d.winRate}% win</span>
              <span className={d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} style={{ minWidth: 60, textAlign: 'right' }}>
                {fmtUsd(d.pnl)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}