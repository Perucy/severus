"""
Severus Knowledge Base

Replaced hardcoded facts with live Wikipedia lookups.
Keeps a thin connection-hints layer so the Investigator
knows which world history topics are meaningfully related.

The actual facts, descriptions, and dates come from Wikipedia
at query time — not from this file.
"""

import httpx
import asyncio
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


# ── DEEP RETRIEVAL ────────────────────────────────────────────

async def get_wikipedia_links(title: str, limit: int = 10) -> list[str]:
    """
    Get the internal Wikipedia links from an article.
    Used to find the next layer of entities to look up.
    Filters to likely-relevant linked articles (proper nouns, named entities).
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action":   "query",
                    "titles":   title,
                    "prop":     "links",
                    "pllimit":  50,
                    "plnamespace": 0,   # main articles only
                    "format":   "json",
                    "origin":   "*",
                },
                timeout=8.0,
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            links = []
            for page in pages.values():
                for link in page.get("links", []):
                    link_title = link.get("title", "")
                    # Filter out meta-pages and short titles
                    if (
                        link_title
                        and not link_title.startswith("List of")
                        and not link_title.startswith("Wikipedia:")
                        and not link_title.startswith("Help:")
                        and len(link_title) > 3
                    ):
                        links.append(link_title)
            return links[:limit]
    except Exception:
        return []


async def deep_wikipedia_retrieval(
    seed_entities: list[str],
    depth: int = 2,
    max_articles: int = 20,
) -> dict[str, Any]:
    """
    Recursively fetch Wikipedia articles starting from seed entities.

    depth=1: fetch seed entities only
    depth=2: fetch seeds + their linked articles
    depth=3: fetch seeds + links + links-of-links

    Returns a rich knowledge dict:
    {
      "articles": { title: { summary, url, thumbnail, depth } },
      "entity_graph": { title: [linked_titles] },
      "total_fetched": int,
    }
    """
    articles: dict[str, dict] = {}
    entity_graph: dict[str, list] = {}
    queue = [(entity, 0) for entity in seed_entities]
    visited = set()

    async with httpx.AsyncClient(timeout=12.0) as client:

        async def fetch_one(title: str, current_depth: int):
            if title in visited or len(articles) >= max_articles:
                return
            visited.add(title)

            # Fetch the article summary
            try:
                resp = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
                    timeout=8.0,
                )
                if resp.status_code != 200:
                    return

                data = resp.json()
                summary = data.get("extract", "")
                if not summary:
                    return

                articles[title] = {
                    "title":       data.get("title", title),
                    "summary":     summary[:800],
                    "url":         data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "thumbnail":   data.get("thumbnail", {}).get("source", ""),
                    "description": data.get("description", ""),
                    "depth":       current_depth,
                }

                # If we have depth budget left, get links for next layer
                if current_depth < depth - 1:
                    links = await get_wikipedia_links(title, limit=8)
                    entity_graph[title] = links
                    # Queue the linked articles for next depth
                    for link in links:
                        if link not in visited:
                            queue.append((link, current_depth + 1))

            except Exception:
                pass

        # Process queue level by level to respect depth
        while queue and len(articles) < max_articles:
            # Take all items at the current minimum depth
            current_level = min(d for _, d in queue)
            current_batch = [(t, d) for t, d in queue if d == current_level]
            queue = [(t, d) for t, d in queue if d != current_level]

            # Fetch current level in parallel
            await asyncio.gather(*[fetch_one(t, d) for t, d in current_batch])

    return {
        "articles":     articles,
        "entity_graph": entity_graph,
        "total_fetched": len(articles),
    }


def format_deep_context(retrieval_result: dict, max_chars: int = 4000) -> str:
    """
    Format deep retrieval results into a dense context string for Claude.
    Depth-0 articles (seed entities) get more space than deeper ones.
    """
    articles = retrieval_result.get("articles", {})
    if not articles:
        return ""

    # Sort by depth then alpha
    sorted_articles = sorted(articles.items(), key=lambda x: (x[1]["depth"], x[0]))

    parts = []
    total = 0

    for title, data in sorted_articles:
        depth_label = ["PRIMARY", "SECONDARY", "TERTIARY"][min(data["depth"], 2)]
        # Give more space to primary sources
        char_limit = 700 if data["depth"] == 0 else 400 if data["depth"] == 1 else 200

        entry = (
            f"[{depth_label}] {data['title']}\n"
            f"{data['summary'][:char_limit]}\n"
        )

        if total + len(entry) > max_chars:
            break

        parts.append(entry)
        total += len(entry)

    return "\n".join(parts)