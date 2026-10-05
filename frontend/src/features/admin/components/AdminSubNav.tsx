import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/catalog', label: 'Catalog', exact: false },
] as const

function isActive(path: string, to: string, exact: boolean) {
  if (exact) return path === to
  return path.startsWith(to)
}

export function AdminSubNav() {
  const path = useLocation().pathname

  return (
    <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
      {tabs.map((tab) => {
        const active = isActive(path, tab.to, tab.exact)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={
              active
                ? 'rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950'
                : 'rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800'
            }
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
