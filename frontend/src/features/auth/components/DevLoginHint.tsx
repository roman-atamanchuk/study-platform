const showDevHint =
  import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN_HINT === 'true'

export function DevLoginHint() {
  if (!showDevHint) return null

  return (
    <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
      <span className="font-medium text-sky-200">Local dev admin:</span> romanatamanchuk5777@gmail.com · password{' '}
      <code className="rounded bg-slate-950 px-1 py-0.5 text-sky-100">A5777qwe</code>
    </p>
  )
}
