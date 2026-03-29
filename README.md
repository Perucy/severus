![](/readme%20image.jpg)

# Severus

> AI-powered learning platform. Any question, any subject, any student.   

> [!Caution]
> This is a self-sponsored project, therefore, the Research feature powered by AI is disabled to prevent misuse (for now). However, you can refer to the [demo](https://www.linkedin.com/posts/perucy-mussiba-361846222_the-classroom-hasnt-changed-in-100-years-ugcPost-7443877853244329984-zO_P?utm_source=share&utm_medium=member_desktop&rcm=ACoAADgCbnkBXUv1_eTeIxyE_ehsfIFNkmqdgFM) to see it in action.


**Live:** [severus-xi.vercel.app](https://severus-xi.vercel.app)

![Severus Platform](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-61dafb)

---

## Overview

Severus is a full-stack AI learning platform that turns any subject into an active learning experience. A student asks a question in their own words. Four AI agents run in sequence — researching, connecting, visualising, and narrating — then map the connections onto an interactive investigation board.

Started with history. Built to work for any subject.

---

## Features

- **AI Research Pipeline** — Four LangGraph agents run in sequence: Historian, Investigator, Visualizer, Guide
- **Interactive 3D Globe** — 37 world history locations with migration arcs, era filters and time slider
- **Investigation Board** — Drag-and-drop node graph with AI-generated connection mapping
- **AI Image Generation** — Real-time historical reconstructions via Google Imagen 4 Fast
- **Timeline** — 315,000 BCE to present with 56 world history events
- **Learn Section** — People, civilizations and contributions across world history
- **Accountability Records** — Sourced entries on ships, companies, families and institutions
- **Dark / Light Mode**
- **Free on any device**

---

## Architecture

```
Frontend (React + Vite)          Backend (FastAPI + LangGraph)
         │                                    │
         │  POST /research                    │
         │ ─────────────────────────────────► │
         │                                    │
         │                          ┌─────────────────┐
         │                          │   LangGraph      │
         │                          │   StateGraph     │
         │                          │                  │
         │                          │  Historian       │
         │                          │  Wikipedia +     │
         │                          │  Severus KB      │
         │                          │       ↓          │
         │                          │  Investigator    │
         │                          │  SlaveVoyages +  │
         │                          │  Connections     │
         │                          │       ↓          │
         │                          │  Visualizer      │
         │                          │  Imagen 4 Fast   │
         │                          │       ↓          │
         │                          │  Guide           │
         │                          │  Narrative       │
         │                          └─────────────────┘
         │                                    │
         │ ◄───────────────────────────────── │
         │     JSON response                  │
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, react-globe.gl |
| Backend | FastAPI, LangGraph, Python 3.11 |
| AI Models | Claude Sonnet 4 (Anthropic) |
| Image Generation | Google Imagen 4 Fast |
| Data Sources | Wikipedia REST API, SlaveVoyages.org |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Anthropic API key
- Google AI API key

### Frontend

```bash
git clone https://github.com/yourusername/severus.git
cd severus
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

### Backend

```bash
cd severus/backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set ANTHROPIC_API_KEY and GOOGLE_AI_API_KEY
python main.py
```

### Environment Variables

**Frontend (`severus/.env`)**
```
VITE_API_URL=http://localhost:8000
```

**Backend (`severus/backend/.env`)**
```
ANTHROPIC_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
FRONTEND_URL=http://localhost:5173
PORT=8000
```

---

## Project Structure

```
severus/
├── src/
│   ├── App.jsx                 # Main app — all 6 sections
│   └── ResearchSection.jsx     # AI agent research UI
├── index.html
├── vite.config.js
└── package.json

severus/backend/
├── main.py                     # FastAPI server
├── graph.py                    # LangGraph StateGraph
├── agents/
│   ├── historian.py            # Wikipedia + Severus KB
│   ├── investigator.py         # Connection tracing
│   ├── visualizer.py           # Image generation
│   └── guide.py                # Narrative synthesis
└── tools/
    ├── knowledge_base.py       # Curated history data
    └── external_apis.py        # Wikipedia, Imagen 4, Veo 3.1
```

---

## API Reference

### `POST /research`

Run the full four-agent pipeline.

**Request**
```json
{
  "question": "What caused the fall of the Roman Empire?",
  "narrative_depth": "teaser",
  "show_reasoning": false
}
```

**Response**
```json
{
  "historian_output": "...",
  "investigator_output": "...",
  "visualizer_output": { "scenes": [...] },
  "guide_narrative": "...",
  "events": [...]
}
```

### `GET /health`

```json
{
  "status": "ok",
  "agents": ["historian", "investigator", "visualizer", "guide"],
  "tools": ["wikipedia", "severus_kb", "slavevoyages", "imagen4"]
}
```

---

## Roadmap

- [ ] Expand to science, law, medicine and economics
- [ ] VR mode — walk through historical sites and environments
- [ ] Student accounts and saved investigations
- [ ] Teacher dashboard and classroom mode
- [ ] Mobile app
- [ ] Multi-language support

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

---

## License

MIT

---

Built by [Perucy Mussiba](https://github.com/perucy)
