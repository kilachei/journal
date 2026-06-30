export const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
  'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'Other',
]

export const SETUPS = [
  'Breakout', 'Trend follow', 'Reversal', 'Support/Resistance',
  'Fibonacci', 'News play', 'ICT/SMC', 'Other',
]

export const SESSIONS = ['London', 'New York', 'Asian', 'Overlap', 'Other']

export const EMOTIONS = [
  { label: '😰 Fearful',   color: 'text-red-400' },
  { label: '😟 Anxious',   color: 'text-orange-400' },
  { label: '😐 Neutral',   color: 'text-slate-400' },
  { label: '😊 Confident', color: 'text-emerald-400' },
  { label: '🔥 Focused',   color: 'text-amber-400' },
]

export const TODAY = new Date().toISOString().split('T')[0]