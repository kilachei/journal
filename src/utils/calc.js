function normalizePair(pair) {
  return pair.toUpperCase().replace('/', '').trim()
}

export function getPipSize(pair) {
  const p = normalizePair(pair)
  if (p.includes('JPY')) return 0.01
  if (p === 'XAUUSD') return 0.01
  if (p === 'XAGUSD') return 0.001
  if (p === 'BTCUSD') return 1
  return 0.0001
}

function getContractSize(pair) {
  const p = normalizePair(pair)
  if (p === 'XAUUSD') return 100
  if (p === 'XAGUSD') return 5000
  if (p === 'BTCUSD') return 1
  return 100000
}

export function getPipValuePerLot(pair, entry) {
  const p = normalizePair(pair)
  const pipSize = getPipSize(pair)
  const contractSize = getContractSize(pair)
  const rawPipValue = pipSize * contractSize

  const quoteCurrency = p.slice(-3)
  if (quoteCurrency === 'USD') return rawPipValue

  const rate = parseFloat(entry)
  if (!rate) return rawPipValue
  return rawPipValue / rate
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
  const pvl     = getPipValuePerLot(t.pair, entry)

  const riskPips   = Math.abs(entry - sl) / pipSize
  const rewardPips = Math.abs(tp - entry) / pipSize
  const rr         = riskPips > 0 ? rewardPips / riskPips : null

  // outcome must be set when you journal the trade: 'win' (hit TP) or 'loss' (hit SL)
  if (!t.outcome) {
    return { pips: null, usd: null, rr: rr ? rr.toFixed(2) : null, result: 'open' }
  }

  const pips = t.outcome === 'win' ? rewardPips : -riskPips
  const usd  = pips * pvl * lots

  return {
    pips: pips.toFixed(1),
    usd:  usd.toFixed(2),
    rr:   rr ? rr.toFixed(2) : null,
    result: t.outcome,
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