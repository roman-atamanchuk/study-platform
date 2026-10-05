import type { AiContingencyTableBlock } from '../types/aiVisualBlocks'

function isHighlighted(
  block: AiContingencyTableBlock,
  rowIndex: number,
  colIndex: number,
  rowLabel: string,
  colLabel: string,
): boolean {
  return (block.highlight ?? []).some(
    (entry) =>
      (entry.row === rowLabel || entry.row === String(rowIndex)) &&
      (entry.column === colLabel || entry.column === String(colIndex)),
  )
}

export function AiContingencyTableView({ block }: { block: AiContingencyTableBlock }) {
  const columns = block.columns ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-black">
      {block.title ? (
        <div className="border-b border-amber-500/25 bg-amber-600/10 px-3 py-2">
          <h4 className="text-sm font-semibold text-amber-100">{block.title}</h4>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead className="bg-amber-600/20 text-amber-50">
            <tr>
              {columns.map((header) => (
                <th key={header} className="border-b border-amber-500/30 px-3 py-2 text-left text-xs font-semibold uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/70">
            {(block.rows ?? []).map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="odd:bg-black even:bg-neutral-950/80">
                {row.map((cell, colIndex) => {
                  const rowLabel = String(row[0] ?? rowIndex)
                  const colLabel = columns[colIndex] ?? String(colIndex)
                  const highlighted = isHighlighted(block, rowIndex, colIndex, rowLabel, colLabel)
                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`px-3 py-2 text-slate-200 ${highlighted ? 'bg-amber-500/25 font-semibold text-amber-50' : ''}`}
                    >
                      {String(cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
