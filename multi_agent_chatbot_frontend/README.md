# Multi-Agent Chatbot Frontend (React)

A minimal, modern, and playful single-page chat UI following the Ocean Professional theme. It features a header, agent indicators, chat window, and a bottom composer with responsive design.

## Highlights
- Playful Ocean theme with vibrant gradients and rounded corners
- Multi-agent indicators with animated status (idle/thinking/responding/error)
- Responsive chat window and sticky composer
- REST API placeholders for backend integration, with simulated responses when backend is unavailable
- Accessibility-minded: focus outlines, keyboard send (Enter), Shift+Enter new lines

## Getting Started

Install and run:

```bash
npm install
npm start
```

Open http://localhost:3000

## Environment Variables

Create a `.env` file at the project root (same folder as package.json), or copy `.env.example` to `.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8000
```

- If REACT_APP_BACKEND_URL is set, API calls go to `${REACT_APP_BACKEND_URL}/api/...`.
- If not set, the app will call relative endpoints (`/api/...`) and will use the development proxy configured in `package.json` to forward to `http://localhost:8000`.

## API Endpoints (placeholders)
- POST {REACT_APP_BACKEND_URL}/api/chat/message  
  Body: `{ "message": string }`  
  Response: `{ "messages": [ { "role": "agent" | "user", "agentId": string, "content": string, "timestamp": number } ], "agentStatus": { [agentId]: "idle" | "thinking" | "responding" | "error" } }`

- GET {REACT_APP_BACKEND_URL}/api/chat/agents/status  
  Response: `{ "agentStatus": { [agentId]: "idle" | "thinking" | "responding" | "error" } }`

## Theme & Styles
- Base tokens and inline styles live in `src/App.js` (themeTokens, styles)
- Global utilities in `src/App.css` and `src/index.css`

## Build
```bash
npm run build
```

## Notes
- This project intentionally avoids heavy UI libraries for a lightweight experience.
- Replace the placeholder fetch endpoints in `App.js` when your backend is ready.

For more, see `steps.txt`.
