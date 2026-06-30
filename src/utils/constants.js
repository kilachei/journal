export const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/CHF', 'BTC/USD',  'XAU/USD',
]

export const SETUPS = [
'CRT & ICT', 'ICT/SMC',
]

export const SESSIONS = ['London', 'New York', 'Asian', ]

export const EMOTIONS = [
  { label: '😰 Fearful',   color: 'text-red-400' },
  { label: '😟 Anxious',   color: 'text-orange-400' },
  { label: '😐 Neutral',   color: 'text-slate-400' },
  { label: '😊 Confident', color: 'text-emerald-400' },
  { label: '🔥 Focused',   color: 'text-amber-400' },
]

export const TODAY = new Date().toISOString().split('T')[0]