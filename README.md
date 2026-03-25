# SEVERUS — History Investigation Platform

## Setup (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org — get the LTS version.

### 2. Add your logo
Copy your lion logo image into the `src/` folder and name it `logo.png`

### 3. Install & Run

Open your terminal, navigate to this folder, then run:

```bash
npm install
npm run dev
```

Open your browser at **http://localhost:5173**

That's it. The globe will load with full NASA Blue Marble textures.

---

## What's built so far

- **Home** — Full dashboard with stats, section cards, dossier index
- **Explore** — 3D interactive globe with:
  - 26 historical locations across 5 categories
  - 14 animated migration arcs
  - Filter by type and era
  - Time slider from 315,000 BCE → Present with era jump buttons
  - Detail panel with live Wikipedia images
  - Dark/light mode toggle

## Next sections to build
- Timeline (300,000 BCE → Present)
- Learn (People, Civilizations, Cultures)
- Reckon (Accountability records)
- Investigate (PI Board)
- Research (AI Agents)

## Deploy to Vercel (free)
```bash
npm run build
```
Then drag the `dist/` folder to vercel.com