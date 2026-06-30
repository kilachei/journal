import { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcTrade, fmtUsd } from '../utils/calc'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0f1320', border: '1px solid #1a2035', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

export default function Performance({ trades }) {
  const withCalc = useMemo(() => trades.map(t => ({ ...t, ...calcTrade(t) })), [trades])
  const settled = withCalc.filter(t => t.result !== 'open')

  const wins = settled.filter(t => t.result === 'win').length
  const losses = settled.filter(t => t.result === 'loss').length
  const bestTrade = settled.length ? Math.max(...settled.map(t => parseFloat(t.usd))) : null
  const worstTrade = settled.length ? Math.min(...settled.map(t => parseFloat(t.usd))) : null

  const pairData = useMemo(() => {
    const map = {}
    settled.forEach(t => {
      if (!map[t.pair]) map[t.pair] = { pair: t.pair, pnl: 0, trades: 0 }
      map[t.pair].pnl += parseFloat(t.usd)
      map[t.pair].trades++
    })
    return Object.values(map).sort((a, b) => b.pnl - a.pnl)
  }, [settled])

  const setupData = useMemo(() => {
    const map = {}
    settled.forEach(t => {
      const s = t.setup || 'Other'
      if (!map[s]) map[s] = { setup: s, pnl: 0, trades: 0 }
      map[s].pnl += parseFloat(t.usd)
      map[s].trades++
    })
    return Object.values(map).sort((a, b) => b.pnl - a.pnl)
  }, [settled])

  const emotionData = useMemo(() => {
    const labels = { 1: 'Fearful', 2: 'Anxious', 3: 'Neutral', 4: 'Confident', 5: 'Focused' }
    const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    settled.forEach(t => {
      const e = t.emotion || 3
      map[e] += parseFloat(t.usd)
      counts[e]++
    })
    return Object.keys(map).map(k => ({
      label: labels[k],
      avg: counts[k] ? parseFloat((map[k] / counts[k]).toFixed(2)) : 0,
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
        <StatCard label="Wins" value={wins} color="text-emerald-400" />
        <StatCard label="Losses" value={losses} color="text-red-400" />
        <StatCard label="Best trade" value={bestTrade !== null ? fmtUsd(bestTrade) : '—'} color="text-emerald-400" small />
        <StatCard label="Worst trade" value={worstTrade !== null ? fmtUsd(worstTrade) : '—'} color="text-red-400" small />
      </div>

      <ChartCard title="P&L by pair">
        <ResponsiveContainer width="100%" height={Math.max(120, pairData.length * 40)}>
          <BarChart data={pairData} layout="vertical">
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
            <YAxis type="category" dataKey="pair" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => ['$' + v, 'P&L']} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {pairData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="P&L by setup">
        <ResponsiveContainer width="100%" height={Math.max(120, setupData.length * 40)}>
          <BarChart data={setupData} layout="vertical">
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
            <YAxis type="category" dataKey="setup" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => ['$' + v, 'P&L']} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {setupData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Avg P&L by mindset">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={emotionData}>
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => ['$' + v, 'Avg P&L']} />
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