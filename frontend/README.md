# Frontend

React 19 + TypeScript + Vite single-page app for the Study Platform: dual-panel workspace, PDF preview (PDF.js), AI tutor panel with visual answers (Plotly, KaTeX, Mermaid), state with Zustand and routing with React Router.

```bash
npm ci
npm run dev     # http://localhost:5173
npm run build   # type-check and production build
npm run lint
```

The API base URL is set with `VITE_API_BASE_URL` (default `http://localhost:8080`). See the main [README](../README.md) for running the full stack with Docker Compose.
