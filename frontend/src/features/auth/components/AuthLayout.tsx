import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Study Material Platform</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-slate-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-sm text-slate-400">{footer}</div>
      </div>
    </main>
  )
}

export function AuthLink(props: React.ComponentProps<typeof Link>) {
  return <Link className="font-medium text-sky-300 hover:text-sky-200" {...props} />
}
