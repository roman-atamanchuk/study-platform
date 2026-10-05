import { sourceLabel, type AiDataTable } from '../types/aiVisuals'
import { AiMixedLatexText } from './AiMixedLatexText'

export function AiDataTableView({ table }: { table: AiDataTable }) {
  const source = sourceLabel(table.source)

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-violet-500/30 bg-black shadow-sm shadow-violet-950/30">
      {table.title ? (
        <div className="flex items-center justify-between gap-2 border-b border-violet-500/25 bg-violet-600/15 px-3 py-2">
          <h4 className="text-sm font-semibold text-violet-100">{table.title}</h4>
          {source ? <span className="text-[11px] text-slate-400">{source}</span> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead className="bg-gradient-to-r from-violet-600/35 to-cyan-600/25 text-violet-50">
            <tr>
              {table.headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-violet-500/35 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {table.rows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${row.join('-')}`}
                className="even:bg-neutral-950/80 odd:bg-black"
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-slate-200">
                    <AiMixedLatexText text={String(cell)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
