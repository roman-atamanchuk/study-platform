import { useParams } from 'react-router-dom'
import { ProgrammePage } from '../pages/ProgrammePage'

export function ProgrammeRoutePage() {
  const { id } = useParams()
  const programmeId = Number(id)

  if (!Number.isFinite(programmeId)) {
    return <main className="p-8 text-rose-300">Invalid programme id.</main>
  }

  return <ProgrammePage programmeId={programmeId} />
}
