export default function Header({ tab, setTab, user, onSignOut }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'log',       label: 'Trade Log' },
    { id: 'stats',     label: 'Performance' },
  ]

  return (
    <header className="border-b border-[#1a2035] bg-[#0c0f18]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 flex items-center justify-center">
              <span className="text-cyan-400 font-mono text-xs font-bold tracking-tight">KJ</span>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-100 leading-tight tracking-tight">
                Kilachei Journals
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">Forex Trade Journal</p>
            </div>
          </div>

          {/* Right side: date + user + sign out + log trade */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-[#141826] border border-[#1a2035] px-3 py-1.5 rounded-full font-mono">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            {/* User name */}
            {user && (
              <span className="hidden md:block text-xs text-slate-400 font-medium truncate max-w-[120px]">
                {user.displayName || user.email}
              </span>
            )}

            {/* Sign out */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="text-xs text-slate-500 hover:text-red-400 border border-[#1a2035] hover:border-red-800/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
            )}

            <button
              onClick={() => setTab('add')}
              className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-black font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-lg whitespace-nowrap"
            >
              + Log trade
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}