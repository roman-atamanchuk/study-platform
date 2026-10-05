declare module 'plotly.js-dist-min' {
  export * from 'plotly.js'
  import Plotly from 'plotly.js'
  export default Plotly
}

declare module 'react-plotly.js/factory' {
  import type { ComponentType } from 'react'
  import type Plotly from 'plotly.js'

  type PlotParams = import('react-plotly.js').PlotParams

  export default function createPlotlyComponent(
    plotly: typeof Plotly,
  ): ComponentType<PlotParams>
}
