export function AiChartNotes({ notes }: { notes?: string[] }) {
  if (!notes?.length) {
    return null
  }

  return (
    <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
      {notes.map((note, index) => (
        <li key={`${note}-${index}`}>{note}</li>
      ))}
    </ul>
  )
}
