import type { AiProbabilityTreeBlock } from '../types/aiVisualBlocks'

const NODE_WIDTH = 132
const NODE_HEIGHT = 42
const H_GAP = 34
const V_GAP = 74
const PAD_X = 36
const PAD_TOP = 28
const PAD_BOTTOM = 42
const CHAR_WIDTH = 7.2
const NODE_PAD = 38

function nodeWidth(...labels: string[]): number {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0)
  return Math.max(NODE_WIDTH, Math.ceil(longest * CHAR_WIDTH + NODE_PAD))
}

function highlightKeys(block: AiProbabilityTreeBlock): Set<string> {
  if (!block.highlightPaths?.length) {
    return new Set()
  }
  return new Set(
    block.highlightPaths
      .filter((path) => Array.isArray(path) && path.every((id) => typeof id === 'string'))
      .map((path) => path.join('>')),
  )
}

export function AiProbabilityTreeChart({ block }: { block: AiProbabilityTreeBlock }) {
  const firstLevel = block.levels?.[0]
  const secondLevel = block.levels?.[1]
  if (!firstLevel?.branches?.length || !secondLevel?.branchesByParent) {
    return (
      <p className="py-4 text-center text-xs text-rose-300">
        Probability tree data is incomplete.
      </p>
    )
  }

  const highlights = highlightKeys(block)
  const firstBranches = firstLevel.branches
  const rootLabel = block.rootLabel ?? 'Start'
  const rootW = nodeWidth(rootLabel)
  const firstY = PAD_TOP + NODE_HEIGHT + V_GAP
  const secondY = firstY + NODE_HEIGHT + V_GAP

  const branchLayouts = firstBranches.map((branch) => {
    const children = secondLevel.branchesByParent[branch.id] ?? []
    const parentWidth = nodeWidth(branch.label, branch.probability)
    const childLayouts = children.map((child) => ({
      branch: child,
      width: nodeWidth(child.label, child.probability),
      x: 0,
    }))
    const childGroupWidth = childLayouts.length
      ? childLayouts.reduce((sum, child) => sum + child.width, 0) +
        (childLayouts.length - 1) * H_GAP
      : 0
    return {
      branch,
      children: childLayouts,
      width: Math.max(parentWidth, childGroupWidth),
      parentWidth,
      x: 0,
      parentX: 0,
    }
  })

  const groupsWidth = branchLayouts.length
    ? branchLayouts.reduce((sum, branch) => sum + branch.width, 0) +
      (branchLayouts.length - 1) * H_GAP
    : rootW
  const contentWidth = Math.max(rootW, groupsWidth)
  const width = Math.ceil(contentWidth + PAD_X * 2)
  const hasSecondLevel = branchLayouts.some((layout) => layout.children.length > 0)
  const height = Math.ceil(
    secondY + NODE_HEIGHT + PAD_BOTTOM - (hasSecondLevel ? 0 : NODE_HEIGHT + V_GAP),
  )

  const rootX = width / 2
  const rootY = PAD_TOP + NODE_HEIGHT / 2
  const firstBranchX = new Map<string, number>()
  const childPos = new Map<string, { x: number; y: number; width: number }>()
  let nextGroupX = PAD_X + (contentWidth - groupsWidth) / 2

  branchLayouts.forEach((layout) => {
    layout.x = nextGroupX
    layout.parentX = layout.x + layout.width / 2
    firstBranchX.set(layout.branch.id, layout.parentX)

    let nextChildX =
      layout.x +
      (layout.width -
        (layout.children.reduce((sum, child) => sum + child.width, 0) +
          Math.max(0, layout.children.length - 1) * H_GAP)) /
        2

    layout.children.forEach((childLayout) => {
      childLayout.x = nextChildX + childLayout.width / 2
      childPos.set(`${layout.branch.id}>${childLayout.branch.id}`, {
        x: childLayout.x,
        y: secondY,
        width: childLayout.width,
      })
      nextChildX += childLayout.width + H_GAP
    })

    nextGroupX += layout.width + H_GAP
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-violet-500/25 bg-black p-3">
      {block.title ? <p className="mb-2 text-sm font-medium text-violet-100">{block.title}</p> : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" role="img" aria-label={block.title ?? 'Probability tree'}>
        {firstLevel.label ? (
          <text x={rootX} y={rootY + NODE_HEIGHT / 2 + V_GAP / 2} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={600}>
            {firstLevel.label.toUpperCase()}
          </text>
        ) : null}
        {secondLevel.label && hasSecondLevel ? (
          <text x={rootX} y={firstY + NODE_HEIGHT / 2 + V_GAP / 2} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={600}>
            {secondLevel.label.toUpperCase()}
          </text>
        ) : null}

        <rect
          x={rootX - rootW / 2}
          y={rootY - NODE_HEIGHT / 2}
          width={rootW}
          height={NODE_HEIGHT}
          rx={18}
          fill="rgba(30,41,59,0.9)"
          stroke="rgba(148,163,184,0.45)"
          strokeWidth={1.5}
        />
        <text x={rootX} y={rootY + 5} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight={600}>
          {rootLabel}
        </text>

        {branchLayouts.map((layout) => {
          const branch = layout.branch
          const branchX = firstBranchX.get(branch.id) ?? rootX
          const highlighted = Array.from(highlights).some((key) => key.startsWith(`${branch.id}>`))

          return (
            <g key={branch.id}>
              <line
                x1={rootX}
                y1={rootY + NODE_HEIGHT / 2}
                x2={branchX}
                y2={firstY - NODE_HEIGHT / 2}
                stroke={highlighted ? '#fbbf24' : 'rgba(148,163,184,0.45)'}
                strokeWidth={highlighted ? 3 : 2}
              />
              <text
                x={(rootX + branchX) / 2}
                y={(rootY + firstY) / 2 - 2}
                textAnchor="middle"
                fill={highlighted ? '#fcd34d' : '#94a3b8'}
                fontSize={11}
                fontWeight={600}
              >
                {branch.probability}
              </text>
              <rect
                x={branchX - layout.parentWidth / 2}
                y={firstY - NODE_HEIGHT / 2}
                width={layout.parentWidth}
                height={NODE_HEIGHT}
                rx={15}
                fill={highlighted ? 'rgba(245,158,11,0.18)' : 'rgba(6,182,212,0.15)'}
                stroke={highlighted ? 'rgba(251,191,36,0.65)' : 'rgba(6,182,212,0.45)'}
                strokeWidth={1.5}
              />
              <text x={branchX} y={firstY + 5} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={600}>
                {branch.label}
              </text>
            </g>
          )
        })}

        {branchLayouts.flatMap((parentLayout) =>
          parentLayout.children.map((childLayout) => {
            const parent = parentLayout.branch
            const child = childLayout.branch
            const parentX = firstBranchX.get(parent.id) ?? rootX
            const pos = childPos.get(`${parent.id}>${child.id}`) ?? {
              x: parentX,
              y: secondY,
              width: childLayout.width,
            }
            const pathKey = `${parent.id}>${child.id}`
            const highlighted = highlights.has(pathKey)

            return (
              <g key={pathKey}>
                <line
                  x1={parentX}
                  y1={firstY + NODE_HEIGHT / 2}
                  x2={pos.x}
                  y2={pos.y - NODE_HEIGHT / 2}
                  stroke={highlighted ? '#fbbf24' : 'rgba(148,163,184,0.45)'}
                  strokeWidth={highlighted ? 3 : 2}
                />
                <text
                  x={(parentX + pos.x) / 2}
                  y={(firstY + pos.y) / 2 + 2}
                  textAnchor="middle"
                  fill={highlighted ? '#fcd34d' : '#94a3b8'}
                  fontSize={11}
                  fontWeight={600}
                >
                  {child.probability}
                </text>
                <rect
                  x={pos.x - pos.width / 2}
                  y={pos.y - NODE_HEIGHT / 2}
                  width={pos.width}
                  height={NODE_HEIGHT}
                  rx={15}
                  fill={highlighted ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.15)'}
                  stroke={highlighted ? 'rgba(251,191,36,0.65)' : 'rgba(16,185,129,0.45)'}
                  strokeWidth={1.5}
                />
                <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={600}>
                  {child.label}
                </text>
              </g>
            )
          }),
        )}
      </svg>
    </div>
  )
}
