export function getPipSize(pair) {
  if (pair.includes('JPY')) return 0.01
  if (pair === 'XAU/USD') return 0.01
  return 0.0001
}

export function getPipValuePerLot(pair) {
  if (pair.includes('JPY')) return 1000
  if (pair === 'XAU/USD') return 1
  return 10
}

export function calcTrade(t) {
  const entry = parseFloat(t.entry)
  const sl    = parseFloat(t.sl)
  const tp    = parseFloat(t.tp)
  const lots  = parseFloat(t.lots) || 0

  if (!entry || !sl || !tp) {
    return { pips: null, usd: null, rr: null, result: 'open' }
  }

  const pipSize = getPipSize(t.pair)
  const pvl     = getPipValuePerLot(t.pair)

  const riskPips   = Math.abs(entry - sl) / pipSize
  const rewardPips = Math.abs(tp - entry) / pipSize
  const rr         = riskPips > 0 ? rewardPips / riskPips : null

  const won  = t.dir === 'Buy' ? tp > entry : tp < entry
  const pips = won ? rewardPips : -riskPips
  const usd  = pips * pvl * lots

  return {
    pips: pips.toFixed(1),
    usd:  usd.toFixed(2),
    rr:   rr ? rr.toFixed(2) : null,
    result: usd >= 0 ? 'win' : 'loss',
  }
}

export function fmtDate(s) {
  if (!s) return '—'
  const [, m, d] = s.split('-')
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1] + ' ' + +d
}

export function fmtUsd(n) {
  if (n === null || n === undefined) return '—'
  const v = parseFloat(n)
  return (v >= 0 ? '+' : '') + '$' + Math.abs(v).toFixed(2)
}