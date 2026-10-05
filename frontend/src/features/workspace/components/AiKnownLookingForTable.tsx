import type { AiKnownLookingForBlock } from '../types/aiVisualBlocks'
import { AiMixedLatexText } from './AiMixedLatexText'

export function AiKnownLookingForTable({ block }: { block: AiKnownLookingForBlock }) {
  const known = block.known ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-500/30 bg-black">
      <div className="border-b border-cyan-500/25 bg-cyan-600/10 px-3 py-2">
        <h4 className="text-sm font-semibold text-cyan-100">Known · Looking for</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[240px] border-collapse text-sm">
          <thead className="bg-cyan-600/15 text-cyan-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Given</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/70">
            {known.map((row) => (
              <tr key={row.label} className="odd:bg-black even:bg-neutral-950/80">
                <td className="px-3 py-2 text-slate-200">{row.label}</td>
                <td className="px-3 py-2 text-slate-200">
                  <AiMixedLatexText text={row.value} />
                </td>
              </tr>
            ))}
            {block.lookingFor ? (
              <tr className="bg-amber-500/10">
                <td className="px-3 py-2 font-medium text-amber-100">Looking for</td>
                <td className="px-3 py-2 font-medium text-amber-50">
                  <AiMixedLatexText text={block.lookingFor} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
