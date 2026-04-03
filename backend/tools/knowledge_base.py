"""
Severus Knowledge Base

Replaced hardcoded facts with live Wikipedia lookups.
Keeps a thin connection-hints layer so the Investigator
knows which world history topics are meaningfully related.

The actual facts, descriptions, and dates come from Wikipedia
at query time — not from this file.
"""

import httpx
from typing import Any


# ── CONNECTION HINTS ──────────────────────────────────────────
# Lightweight map of which history topics connect to which.
# Used by the Investigator to seed the PI board with real edges.
# Format: { topic_id: [connected_topic_ids] }
# These are HINTS only — the agent validates them with Wikipedia.

CONNECTION_HINTS: dict[str, list[str]] = {
    # African civilisations
    "great-rift-valley":    ["ancient-egypt", "kingdom-of-kush", "homo-sapiens"],
    "ancient-egypt":        ["kingdom-of-kush", "ancient-greece", "roman-empire", "alexander-the-great"],
    "kingdom-of-kush":      ["ancient-egypt", "great-rift-valley", "axum"],
    "axum":                 ["kingdom-of-kush", "ancient-egypt", "silk-road"],
    "mali-empire":          ["timbuktu", "mansa-musa", "trans-saharan-trade", "trans-atlantic-slave-trade"],
    "songhai-empire":       ["mali-empire", "timbuktu", "trans-saharan-trade"],
    "kingdom-of-benin":     ["trans-atlantic-slave-trade", "benin-bronzes", "british-empire"],
    "great-zimbabwe":       ["trans-saharan-trade", "swahili-coast"],
    "swahili-coast":        ["great-zimbabwe", "silk-road", "indian-ocean-trade"],

    # People
    "mansa-musa":           ["mali-empire", "timbuktu", "trans-saharan-trade"],
    "toussaint-louverture": ["haitian-revolution", "trans-atlantic-slave-trade", "napoleon-bonaparte"],
    "kwame-nkrumah":        ["ghanaian-independence", "pan-africanism", "berlin-conference"],
    "harriet-tubman":       ["trans-atlantic-slave-trade", "american-civil-war", "underground-railroad"],
    "nelson-mandela":       ["apartheid", "african-national-congress", "cold-war"],
    "thomas-sankara":       ["burkina-faso", "pan-africanism", "cold-war"],

    # The slave trade and colonialism
    "trans-atlantic-slave-trade": ["royal-african-company", "haitian-revolution", "american-civil-war",
                                    "kingdom-of-benin", "mali-empire", "lloyds-of-london"],
    "royal-african-company":      ["trans-atlantic-slave-trade", "lloyds-of-london", "british-empire"],
    "lloyds-of-london":           ["royal-african-company", "trans-atlantic-slave-trade", "british-empire"],
    "berlin-conference":          ["scramble-for-africa", "belgian-congo", "british-empire", "french-empire"],
    "scramble-for-africa":        ["berlin-conference", "belgian-congo", "british-empire"],
    "belgian-congo":              ["berlin-conference", "leopold-ii", "scramble-for-africa"],
    "haitian-revolution":         ["trans-atlantic-slave-trade", "toussaint-louverture", "french-revolution",
                                    "napoleon-bonaparte"],

    # European empires
    "british-empire":       ["berlin-conference", "trans-atlantic-slave-trade", "kingdom-of-benin",
                              "indian-independence", "scramble-for-africa"],
    "roman-empire":         ["ancient-egypt", "ancient-greece", "fall-of-rome", "byzantine-empire"],
    "mongol-empire":        ["silk-road", "black-death", "genghis-khan"],
    "ottoman-empire":       ["byzantine-empire", "silk-road", "world-war-i", "fall-of-rome"],

    # Asian civilisations
    "silk-road":            ["mongol-empire", "tang-dynasty", "byzantine-empire", "swahili-coast",
                              "black-death", "axum"],
    "tang-dynasty":         ["silk-road", "confucianism"],
    "ming-dynasty":         ["silk-road", "zheng-he"],
    "mughal-empire":        ["british-empire", "silk-road", "indian-independence"],

    # The modern era
    "world-war-i":          ["ottoman-empire", "world-war-ii", "treaty-of-versailles", "russian-revolution"],
    "world-war-ii":         ["world-war-i", "holocaust", "cold-war", "atomic-bomb"],
    "cold-war":             ["world-war-ii", "cuban-missile-crisis", "vietnam-war", "nelson-mandela"],
    "french-revolution":    ["napoleon-bonaparte", "haitian-revolution", "enlightenment"],
    "russian-revolution":   ["world-war-i", "cold-war", "joseph-stalin"],
    "apartheid":            ["nelson-mandela", "cold-war", "african-national-congress"],
    "indian-independence":  ["british-empire", "gandhi", "cold-war"],
    "benin-bronzes":        ["kingdom-of-benin", "british-empire", "repatriation-debate"],
    "repatriation-debate":  ["benin-bronzes", "british-museum", "kingdom-of-benin"],
}


def get_connection_hints(topic: str) -> list[str]:
    """
    Returns known related topics for a given topic string.
    Fuzzy-matches against the hints map.
    """
    topic_lower = topic.lower().replace(" ", "-")
    # Direct match
    if topic_lower in CONNECTION_HINTS:
        return CONNECTION_HINTS[topic_lower]
    # Partial match
    for key, connections in CONNECTION_HINTS.items():
        if topic_lower in key or key in topic_lower:
            return connections
    return []


# ── LIVE WIKIPEDIA LOOKUP ─────────────────────────────────────

async def search_wikipedia(query: str, limit: int = 3) -> list[dict[str, Any]]:
    """
    Search Wikipedia and return top results with summaries and thumbnails.
    Uses the Wikipedia REST API — no API key needed.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Step 1: search for pages
            search_resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action":   "query",
                    "list":     "search",
                    "srsearch": query,
                    "srlimit":  limit,
                    "format":   "json",
                    "origin":   "*",
                },
            )
            search_data = search_resp.json()
            pages = search_data.get("query", {}).get("search", [])
            if not pages:
                return []

            results = []
            for page in pages[:limit]:
                title = page["title"]
                # Step 2: get summary + thumbnail for each page
                summary_resp = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
                    timeout=8.0,
                )
                if summary_resp.status_code == 200:
                    data = summary_resp.json()
                    results.append({
                        "title":       data.get("title", title),
                        "summary":     data.get("extract", "")[:600],
                        "url":         data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                        "thumbnail":   data.get("thumbnail", {}).get("source", ""),
                        "description": data.get("description", ""),
                    })

            return results

    except Exception as e:
        return [{"error": str(e), "title": query, "summary": "", "url": "", "thumbnail": ""}]


async def get_wikipedia_summary(title: str) -> dict[str, Any]:
    """
    Get a single Wikipedia article summary + thumbnail by exact title.
    More reliable than search when you know the topic name.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
                timeout=8.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "title":       data.get("title", title),
                    "summary":     data.get("extract", "")[:800],
                    "url":         data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "thumbnail":   data.get("thumbnail", {}).get("source", ""),
                    "description": data.get("description", ""),
                    "found":       True,
                }
            return {"found": False, "title": title, "summary": "", "thumbnail": ""}
    except Exception as e:
        return {"found": False, "error": str(e), "title": title, "summary": "", "thumbnail": ""}