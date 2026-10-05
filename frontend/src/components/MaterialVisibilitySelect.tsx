import type { MaterialVisibility } from '../api/materials'

interface MaterialVisibilitySelectProps {
  value: MaterialVisibility
  onChange: (value: MaterialVisibility) => void
  context: 'official' | 'personal'
  allowPublic?: boolean
  className?: string
}

const OFFICIAL_HELP: Record<MaterialVisibility, string> = {
  PUBLIC: 'Visible on the public course page and in student workspaces',
  SHARED: 'Official copy — not on public course page (admin preview only)',
  PRIVATE: 'Hidden from students — admin only',
}

const PERSONAL_HELP: Record<MaterialVisibility, string> = {
  PUBLIC: 'Only admins can publish to the public course',
  SHARED: 'Included when you share this course version (default)',
  PRIVATE: 'Only you can see this material',
}

const ADMIN_PERSONAL_HELP: Record<MaterialVisibility, string> = {
  PUBLIC: 'Visible on the public course page for all students',
  SHARED: 'Included when you share this course version',
  PRIVATE: 'Only you can see this material',
}

export function MaterialVisibilitySelect({
  value,
  onChange,
  context,
  allowPublic = false,
  className = '',
}: MaterialVisibilitySelectProps) {
  const help =
    context === 'official'
      ? OFFICIAL_HELP
      : allowPublic
        ? ADMIN_PERSONAL_HELP
        : PERSONAL_HELP

  return (
    <div className={className}>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Visibility</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MaterialVisibility)}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
      >
        {allowPublic || context === 'official' ? <option value="PUBLIC">Public</option> : null}
        <option value="SHARED">Shared</option>
        <option value="PRIVATE">Private</option>
      </select>
      <p className="mt-1 text-xs text-slate-500">{help[value]}</p>
    </div>
  )
}
