# AI Visuals Data Schema

This document defines the JSON structure the AI tutor returns and how the study platform renders it.

**Principle:** The AI **extracts data** from the exam page and solution. The app **renders** visuals with real libraries — not the model drawing charts in text.

| Content        | Library              | Frontend component   |
|----------------|----------------------|----------------------|
| Explanation    | Markdown             | `AiMarkdownContent`  |
| Tables         | React (styled HTML)  | `AiDataTableView`    |
| Charts         | **Plotly.js**        | `AiChartBlock`       |
| Formulas       | **KaTeX**            | `AiFormulaList`      |

TypeScript definitions live in:

- `frontend/src/features/workspace/types/aiVisuals.ts`
- `frontend/src/features/workspace/types/chartTypes.ts`

Backend parser: `AiStructuredResponseParser.java`  
Stored in DB: `AiMessage.visualsJson`, `AiAnswerCache.visualsJson` (migration V15)

---

## Top-level AI response

The model returns **one JSON object** (`response_format: json_object`). No markdown fences around the root object.

```json
{
  "markdown": "## Q5 (b) – Boxplot\n\nBrief interpretation only. No pipe tables or chart JSON here.",
  "visuals": {
    "tables": [],
    "charts": [],
    "formulas": []
  }
}
```

| Field      | Type   | Required | Description                                      |
|------------|--------|----------|--------------------------------------------------|
| `markdown` | string | yes      | Short explanation, headers, steps                |
| `visuals`  | object | no       | Structured data for tables, charts, formulas     |

**Rules for the AI**

- Put **all** tabular data in `visuals.tables` — not markdown pipe tables.
- Put **all** charts in `visuals.charts` — the UI renders them with Plotly.
- Put **all** formulas in `visuals.formulas` — LaTeX in the `latex` field.
- Prefer values from the **exam page** and **official solution**; mark the source on each item.
- Omit empty arrays (`tables`, `charts`, `formulas`) when not needed.

---

## `visuals` object

```typescript
interface AiVisualsPayload {
  tables?: AiDataTable[]
  charts?: ChartSpec[]
  formulas?: AiFormulaVisual[]
}
```

---

## Source field

Used on tables, charts, and formulas to show where data came from.

| Value          | UI label                 | When to use                                      |
|----------------|--------------------------|--------------------------------------------------|
| `exam`         | From exam page           | Value read directly from the exam PDF text       |
| `solution`     | From official solution   | Value from linked solution page                  |
| `derived`      | Derived from page data   | Calculated from exam/solution (e.g. range/4)     |
| `illustrative` | Illustrative example     | Reasonable estimate when exact numbers missing   |

---

## Tables (`visuals.tables[]`)

Rendered as styled HTML tables with optional title and source badge.

```typescript
interface AiDataTable {
  title?: string
  headers: string[]      // column names, left to right
  rows: string[][]       // each row same length as headers
  source?: AiVisualSource
}
```

### Example — symbol table (formula questions)

```json
{
  "title": "Symbol table",
  "headers": ["Symbol", "Meaning", "Value in this question"],
  "rows": [
    ["n", "Total number of apps", "64"],
    ["r", "Number to select", "20"],
    ["!", "Factorial", "n × (n−1) × … × 1"]
  ],
  "source": "exam"
}
```

### Example — five-number summary (boxplot questions)

```json
{
  "title": "Five-number summary",
  "headers": ["Statistic", "Value (tonnes)", "Source"],
  "rows": [
    ["Min", "25", "solution"],
    ["Q1", "27.5", "derived"],
    ["Median", "30", "derived"],
    ["Q3", "32.5", "derived"],
    ["Max", "35", "solution"]
  ],
  "source": "solution"
}
```

### Example — solution comparison (solve questions)

```json
{
  "title": "Answer check",
  "headers": ["Step", "Your answer", "Official solution", "Match"],
  "rows": [
    ["Final probability", "0.042", "0.042", "Yes"]
  ],
  "source": "solution"
}
```

---

## Charts (`visuals.charts[]`)

All charts share a common wrapper. Plotly.js renders them in `AiChartBlock`.

```typescript
interface ChartSpec {
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'boxplot'  // default: 'bar'
  title?: string
  xLabel?: string          // axis label (category axis for bar/line; value axis for horizontal boxplot)
  yLabel?: string
  orientation?: 'horizontal' | 'vertical'  // boxplot only; default horizontal for mass/output context
  source?: AiVisualSource
  labels: string[]         // category names (x for bar/line; y for horizontal boxplot)
  datasets: ChartDatasetSpec[]
}

interface ChartDatasetSpec {
  label?: string
  data: number[] | BoxplotPointSpec[]   // see chart type below
  backgroundColor?: string | string[]     // optional; app has defaults
  borderColor?: string | string[]
}
```

---

### Bar chart (`type: "bar"`)

Use for counts, frequencies, simple comparisons.

**`datasets[].data`:** array of numbers, one per entry in `labels`.

```json
{
  "type": "bar",
  "title": "App selections by category",
  "xLabel": "Category",
  "yLabel": "Count",
  "source": "illustrative",
  "labels": ["Games", "Social", "Tools"],
  "datasets": [
    {
      "label": "Count",
      "data": [12, 19, 8]
    }
  ]
}
```

---

### Line chart (`type: "line"`)

Use for trends over ordered categories or time steps.

**`datasets[].data`:** array of numbers, same length as `labels`.

```json
{
  "type": "line",
  "title": "Output over shifts",
  "xLabel": "Shift",
  "yLabel": "Mean mass (tonnes)",
  "labels": ["Morning", "Evening", "Night"],
  "datasets": [
    {
      "label": "Mean output",
      "data": [28, 30, 27]
    }
  ],
  "source": "derived"
}
```

---

### Pie chart (`type: "pie"`)

Use for parts of a whole (percentages, proportions).

**`datasets[0].data`:** slice sizes, same length as `labels`.

```json
{
  "type": "pie",
  "title": "Shift distribution",
  "labels": ["Morning", "Evening", "Night"],
  "datasets": [
    {
      "data": [40, 35, 25]
    }
  ],
  "source": "exam"
}
```

---

### Doughnut chart (`type: "doughnut"`)

Same data shape as pie; rendered with a centre hole.

```json
{
  "type": "doughnut",
  "title": "Variable types in Q5 (a)",
  "labels": ["Binary", "Nominal", "Ordinal", "Discrete", "Continuous"],
  "datasets": [
    {
      "data": [1, 1, 1, 1, 1]
    }
  ],
  "source": "exam"
}
```

---

### Boxplot (`type: "boxplot"`)

Use for five-number summaries (Min, Q1, Median, Q3, Max). Typical for statistics exam questions.

**`datasets[].data`:** array of **boxplot point objects** (not plain numbers).

```typescript
interface BoxplotPointSpec {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers?: number[]    // optional points beyond whiskers
}
```

**Orientation**

- `"horizontal"` — value axis on **x** (e.g. mass in tonnes). **Preferred** for exam-style output boxplots.
- `"vertical"` — value axis on **y**.

The app auto-corrects common AI mistakes (e.g. 0–10 toy scale on mass questions → 25–35 tonnes) when `xLabel`/`labels` indicate mass/output context.

```json
{
  "type": "boxplot",
  "title": "Output – mass (tonnes)",
  "orientation": "horizontal",
  "xLabel": "mass (tonnes)",
  "yLabel": "Output",
  "source": "solution",
  "labels": ["Output"],
  "datasets": [
    {
      "label": "Output",
      "data": [
        {
          "min": 25,
          "q1": 27.5,
          "median": 30,
          "q3": 32.5,
          "max": 35,
          "outliers": []
        }
      ]
    }
  ]
}
```

**Multiple boxes:** add one object per box in `datasets[].data`, and matching entries in `labels`:

```json
{
  "type": "boxplot",
  "orientation": "horizontal",
  "xLabel": "mass (tonnes)",
  "labels": ["Morning shift", "Evening shift"],
  "datasets": [
    {
      "label": "Output by shift",
      "data": [
        { "min": 24, "q1": 27, "median": 29, "q3": 31, "max": 34 },
        { "min": 26, "q1": 28, "median": 31, "q3": 33, "max": 36 }
      ]
    }
  ],
  "source": "derived"
}
```

---

## Formulas (`visuals.formulas[]`)

Rendered with KaTeX. Use LaTeX without `$` delimiters in the `latex` field.

```typescript
interface AiFormulaVisual {
  name?: string
  latex: string
  source?: AiVisualSource
}
```

### Example

```json
{
  "name": "Combination formula",
  "latex": "\\binom{n}{r} = \\frac{n!}{r!(n-r)!}",
  "source": "exam"
}
```

### Example — SD estimate

```json
{
  "name": "Standard deviation estimate",
  "latex": "SD \\approx \\frac{\\text{range}}{4} = 2.5",
  "source": "solution"
}
```

---

## Full response example (Q5 b boxplot)

```json
{
  "markdown": "## Q5 (b) – Boxplot of output\n\nThe solution estimates **SD ≈ range/4 = 2.5**, so the range is about **10 tonnes**. The boxplot below uses values consistent with that estimate.",
  "visuals": {
    "tables": [
      {
        "title": "Five-number summary",
        "headers": ["Statistic", "Value (tonnes)", "Notes"],
        "rows": [
          ["Min", "25", "From solution context"],
          ["Q1", "27.5", "Derived"],
          ["Median", "30", "Derived"],
          ["Q3", "32.5", "Derived"],
          ["Max", "35", "From solution context"]
        ],
        "source": "solution"
      }
    ],
    "charts": [
      {
        "type": "boxplot",
        "title": "Output distribution",
        "orientation": "horizontal",
        "xLabel": "mass (tonnes)",
        "yLabel": "Output",
        "source": "derived",
        "labels": ["Output"],
        "datasets": [
          {
            "label": "Output",
            "data": [
              {
                "min": 25,
                "q1": 27.5,
                "median": 30,
                "q3": 32.5,
                "max": 35,
                "outliers": []
              }
            ]
          }
        ]
      }
    ],
    "formulas": [
      {
        "name": "SD estimate",
        "latex": "SD \\approx \\frac{\\max - \\min}{4}",
        "source": "solution"
      }
    ]
  }
}
```

---

## API surface

### Chat response (`POST /my-courses/{id}/ai/chat`)

Assistant message includes:

```typescript
interface AiMessage {
  id: number
  role: 'USER' | 'ASSISTANT'
  content: string           // markdown only
  visualsJson: string | null // JSON string of AiVisualsPayload
  modelId: string | null
  cached: boolean
  createdAt: string
}
```

### Frontend rendering order

1. `content` → markdown text  
2. `visuals.formulas` → formula cards  
3. `visuals.tables` → data tables  
4. `visuals.charts` → Plotly charts  

---

## Adding a new chart type

1. Extend `ChartSpec.type` in `chartTypes.ts`
2. Add a trace builder in `plotlyChartBuilder.ts`
3. Document the JSON shape in this file
4. Add an example to `AiTutorRules.java` intent hints if the AI should use it

---

## Legacy / fallback

Older cached answers may contain:

- Markdown-only text
- Embedded ` ```chart ` blocks inside markdown
- **Bare chart JSON** in `content` (DeepSeek sometimes returns `{ "type": "boxplot", ... }` without a `markdown` wrapper)

The parser (`AiStructuredResponseParser`) normalizes all of these into `markdown` + `visualsJson`. Cache key version `struct-v2` busts pre-fix library entries.

When the user provides quartiles in the prompt (`q1=28 q3=32`), those values override AI guesses for min/median/max.
