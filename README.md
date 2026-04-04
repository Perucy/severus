![Severus](/readme%20image.jpg)

# Severus

> The history every student deserves to know.

**Live:** [severus-xi.vercel.app](https://severus-xi.vercel.app)

![Status](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-61dafb)

---

## What is Severus?

Severus is a free, open-source AI-powered world history learning platform. Ask any history question in plain language and four AI agents research it, map the connections, and narrate the story. Built for students who deserve better than a textbook.

300 million students worldwide have no access to quality history education. Severus is the infrastructure to change that — free, on any device, in any language.

> [!NOTE]
> The AI Research feature requires your own Anthropic API key (free tier works). Add it via the **Add Key** button in the top bar. Your key never leaves your browser — it goes directly to Anthropic's API and is never sent to Severus servers. [See Security & Privacy.](#security--privacy)

---

## Features

| Section | What it does |
|---|---|
| **🌍 Explore** | Interactive 3D globe — 40+ world history locations, migration arcs, era time slider, live Wikipedia geographic search |
| **📅 Timeline** | 60+ events from 315,000 BCE to 2020. Filter by era and world region. Build your own personal timeline saved locally |
| **📚 Learn** | People, civilizations, contributions across world history. Search locally or falls back to live Wikipedia automatically |
| **📍 Sites** | 11 major historical sites with facts and direct links to Google Maps, YouTube 360° tours, and Google Arts & Culture |
| **🔬 Investigate** | Dark-canvas PI board — drag nodes, draw connections, click any node for Wikipedia + AI context, AI Chat edits the board live |
| **🤖 Research** | Four AI agents answer any history question: Historian → Investigator → Visualizer → Guide |
| **🔥 Journey** | Personal learning dashboard — activity heatmap, region coverage, era coverage, top topics. All local, zero accounts |

---

## Architecture

```
Your Browser                          Severus Backend (Railway)
     │                                          │
     │  Your key — direct browser call          │
     │ ──────────────────────────► Anthropic API│
     │  (PI board node info, AI chat)           │
     │                                          │
     │  POST /research (server key)             │
     │ ────────────────────────────────────────►│
     │                               ┌──────────────────┐
     │                               │  LangGraph        │
     │                               │  Historian ↓      │
     │                               │  Investigator ↓   │
     │                               │  Visualizer ↓     │
     │                               │  Guide            │
     │                               └──────────────────┘
     │ ◄────────────────────────────────────────│
     │         JSON response                    │
```

**Two types of AI calls:**

- **Server-side** (`/research`, `/chat`) — Severus's own key on Railway. No user key needed for the core pipeline.
- **Client-side** (node info, PI board chat) — user's key, sent directly browser → `api.anthropic.com`. Never touches Severus servers.

---

## Security & Privacy

**Your API key never leaves your browser.**
Stored in `localStorage` only. Sent directly from your browser to `api.anthropic.com`. Never transmitted to Railway. Vercel serves only static files — there is no server-side code that could intercept it.

**Your learning data never leaves your browser.**
The Journey section tracks activity in `localStorage` only. No account system, no user IDs, no analytics. Clear it any time from the Journey section.

**Severus is open source — verify all of this yourself in the code.**

**Content Security Policy** is enforced via `vercel.json` — the browser will block any network request to a domain not explicitly whitelisted, so even if an XSS vulnerability existed, your key could not be exfiltrated.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, react-globe.gl |
| Backend | FastAPI, LangGraph, Python 3.11 |
| AI | Claude Sonnet 4 (Anthropic) |
| Images | Wikipedia REST API |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/keys)

### Frontend

```bash
git clone https://github.com/Perucy/severus.git
cd severus
npm install
npm run dev
```

Create `.env` in the project root (gitignored — never commit this):

```
VITE_API_URL=http://localhost:8000
```

### Backend

```bash
cd severus/severus-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Create `.env` in `severus-backend/` (gitignored — never commit this):

```
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
PORT=8000
```

### Adding your API key in the app

Click **Add Key** in the top bar → paste your Anthropic key → **Save Key** → **Test Key** to verify.

This unlocks:
- PI board node info — Wikipedia image + AI historical context on every node
- PI board AI chat — the AI can add nodes and edges to your board in real time

---

## Project Structure

```
severus/
├── src/
│   ├── App.jsx              # All frontend sections
│   └── ResearchSection.jsx  # AI research UI
├── vercel.json              # Build config + CSP security headers (safe to commit)
├── index.html
├── vite.config.js
└── package.json

severus/severus-backend/
├── main.py                  # FastAPI — /research, /chat, /health
├── graph.py                 # LangGraph StateGraph
├── agents/
│   ├── historian.py
│   ├── investigator.py
│   ├── visualizer.py
│   └── guide.py
└── tools/
    ├── knowledge_base.py
    └── external_apis.py
```

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variable in Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL = https://your-backend.up.railway.app
   ```
4. Deploy. `vercel.json` handles build config and security headers automatically.

### Backend (Railway)

1. Create Railway project from `severus-backend/`
2. Add variables in Railway → Variables:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   FRONTEND_URL      = https://your-app.vercel.app
   PORT              = 8000
   ```

---

## API Reference

### `POST /research`

```json
{
  "question": "What caused the fall of the Roman Empire?",
  "narrative_depth": "teaser",
  "show_reasoning": false
}
```

### `POST /chat`

```json
{
  "message": "How does the Silk Road connect to the Black Death?",
  "nodes": [...],
  "edges": [...]
}
```

### `GET /health`

```json
{ "status": "ok" }
```

---

## What's Out of Scope (and Why)

**In-browser VR / immersive 3D historical environments**
True photospheres need specialist 360° camera rigs. Embedding third-party viewers introduces CORS, licensing, and broken iframes. The Sites section links to Google Maps, YouTube 360° tours, and Google Arts & Culture — all better than any iframe. AI reconstruction (NeRF / Gaussian Splatting) is on the roadmap but not practical in a single-page app today.

**AI image generation**
Costs money per request. With anonymous users and no payment system this would be unbounded spend. Wikipedia covers 90%+ of what Severus needs. Revisit when there's a paid tier or users bring their own Google AI key.

**Student accounts**
Deliberately excluded. Accounts mean servers, databases, GDPR compliance, password resets, and cost. Everything Severus needs to personalise the experience (API key, personal timeline, learning journey) lives in `localStorage`. No signup required.

---

## Roadmap

- [ ] Teacher dashboard and classroom mode
- [ ] Multi-language support
- [ ] Expand beyond history — science, law, economics, medicine
- [ ] Mobile app
- [ ] AI historical reconstruction (Phase 3)

---

## Contributing

```bash
git checkout -b feature/your-feature
git commit -m 'add your feature'
git push origin feature/your-feature
# open a pull request
```

Pull requests are welcome. Open an issue first for major changes.

---

## License and Copyright
Copyright (c) 2024 Perucy Astus Mussiba. All rights reserved.

This software is provided under the GNU AGPLv3. 
Any use of this software outside the terms of this license is strictly 
prohibited without prior written consent from the copyright holder.


Built by [Perucy Mussiba](https://github.com/Perucy)
