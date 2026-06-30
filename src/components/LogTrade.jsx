import { useState, useMemo } from 'react'
import { PAIRS, SETUPS, SESSIONS, EMOTIONS, TODAY } from '../utils/constants'

const EMPTY = {
  pair: 'EUR/USD', dir: 'Buy', date: TODAY, time: '',
  entry: '', sl: '', tp: '', lots: '',
  setup: 'Breakout', session: 'London', emotion: 3,
  notes: '',
}

function calcPreview(entry, sl, tp, pair) {
  const e = parseFloat(entry), s = parseFloat(sl), p = parseFloat(tp)
  if (!e || !s || !p) return null
  const pipSize = pair.includes('JPY') || pair === 'XAU/USD' ? 0.01 : 0.0001
  const riskPips = Math.abs(e - s) / pipSize
  const rewardPips = Math.abs(p - e) / pipSize
  if (riskPips === 0) return null
  return {
    rr: (rewardPips / riskPips).toFixed(2),
    riskPips: riskPips.toFixed(1),
    rewardPips: rewardPips.toFixed(1),
  }
}

export default function LogTrade({ onAdd }) {
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const preview = useMemo(
    () => calcPreview(form.entry, form.sl, form.tp, form.pair),
    [form.entry, form.sl, form.tp, form.pair]
  )

  function submit() {
    if (!form.entry || !form.sl || !form.tp) {
      setErr('Entry, stop loss, and take profit are all required.')
      return
    }
    setErr('')
    onAdd(form)
    setForm(f => ({ ...EMPTY, pair: f.pair, setup: f.setup, session: f.session }))
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Log a trade</h2>
        <p className="text-sm text-slate-500 mt-0.5">Record your setup, execution and mindset.</p>
      </div>

      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Pair</label>
            <select value={form.pair} onChange={e => set('pair', e.target.value)}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Direction</label>
            <div className="flex gap-2">
              {['Buy', 'Sell'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('dir', d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    form.dir === d
                      ? d === 'Buy'
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                        : 'bg-red-950 border-red-700 text-red-400'
                      : 'bg-transparent border-[#1a2035] text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Entry price</label>
            <input type="number" step="0.00001" placeholder="1.08200" value={form.entry} onChange={e => set('entry', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Stop loss</label>
            <input type="number" step="0.00001" placeholder="1.07900" value={form.sl} onChange={e => set('sl', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Take profit</label>
            <input type="number" step="0.00001" placeholder="1.08800" value={form.tp} onChange={e => set('tp', e.target.value)} />
          </div>
        </div>

        {preview && (
          <div className="flex flex-wrap gap-4 bg-cyan-950/15 border border-cyan-800/20 rounded-xl px-4 py-3 text-xs font-mono">
            <span className="text-slate-500">Risk: <span className="text-red-400 font-semibold">{preview.riskPips} pips</span></span>
            <span className="text-slate-500">Reward: <span className="text-emerald-400 font-semibold">{preview.rewardPips} pips</span></span>
            <span className="text-slate-500">R:R → <span className="text-cyan-400 font-bold">1:{preview.rr}</span></span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Lot size</label>
            <input type="number" step="0.01" placeholder="0.10" value={form.lots} onChange={e => set('lots', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Setup</label>
            <select value={form.setup} onChange={e => set('setup', e.target.value)}>
              {SETUPS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Session</label>
            <select value={form.session} onChange={e => set('session', e.target.value)}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1320] border border-[#1a2035] rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
            Mindset — <span className={EMOTIONS[form.emotion - 1].color}>{EMOTIONS[form.emotion - 1].label}</span>
          </label>
          <input type="range" min="1" max="5" step="1" value={form.emotion} onChange={e => set('emotion', +e.target.value)} className="w-full accent-cyan-500" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Notes / lessons learned</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="What did you see? What would you do differently?"
            className="h-20 resize-none"
          />
        </div>
      </div>

      {err && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-4 py-2">{err}</p>}

      <div className="flex justify-end">
        <button onClick={submit} className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-black font-semibold text-sm px-6 py-2 rounded-lg">
          Log trade
        </button>
      </div>
    </div>
  )
}