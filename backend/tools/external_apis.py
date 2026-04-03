"""
External API Tools for Severus Agents
- Tavily Web Search
- Wikipedia REST API (with fallback)
- Google Imagen 4 Fast
- Veo 3.1 Video Generation
"""

import httpx
import os
import base64
from typing import Any


# ── TAVILY WEB SEARCH ─────────────────────────────────────────
async def search_web(
    query: str,
    max_results: int = 5,
    search_depth: str = "basic",  # "basic" | "advanced"
    include_domains: list[str] = None,
) -> dict[str, Any]:
    """
    Search the web using Tavily API.
    Returns clean, structured results ready for agent consumption.
    Free tier: 1000 searches/month.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return {
            "error": "TAVILY_API_KEY not set — falling back to Wikipedia",
            "results": [],
        }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            payload = {
                "api_key":      api_key,
                "query":        query,
                "max_results":  max_results,
                "search_depth": search_depth,
                "include_answer": True,           # Tavily generates a direct answer
                "include_raw_content": False,
            }
            if include_domains:
                payload["include_domains"] = include_domains

            resp = await client.post(
                "https://api.tavily.com/search",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15.0,
            )

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "answer":  data.get("answer", ""),           # Direct AI answer
                    "results": [
                        {
                            "title":   r.get("title", ""),
                            "url":     r.get("url", ""),
                            "content": r.get("content", "")[:800],  # Trim for token budget
                            "score":   r.get("score", 0),
                        }
                        for r in data.get("results", [])[:max_results]
                    ],
                    "query": query,
                }

            return {
                "error": f"Tavily returned HTTP {resp.status_code}",
                "results": [],
            }

    except Exception as e:
        return {
            "error": f"Tavily search failed: {str(e)}",
            "results": [],
        }

from typing import Any


# ── WIKIPEDIA ─────────────────────────────────────────────────
async def search_wikipedia(query: str) -> dict[str, Any]:
    """
    Search Wikipedia. Uses the REST summary API with fallback
    to the action API if the first call fails.
    """
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:

            # Step 1 — search for best matching article title
            search_resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "srlimit": 3,
                    "format": "json",
                    "origin": "*",
                },
                headers={"Accept": "application/json"},
            )
            search_resp.raise_for_status()
            raw = search_resp.text.strip()
            if not raw:
                return _wikipedia_fallback(query)

            search_data = search_resp.json()
            results = search_data.get("query", {}).get("search", [])
            if not results:
                return {"error": f"No Wikipedia results for '{query}'", "query": query}

            title = results[0]["title"]

            # Step 2 — get the full summary for the top result
            summary_resp = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
                headers={
                    "Api-User-Agent": "SeverusPlatform/1.0 (https://github.com/severus; contact@severus.africa)",
                    "Accept": "application/json",
                },
                timeout=10.0,
            )
            summary_resp.raise_for_status()
            raw2 = summary_resp.text.strip()
            if not raw2:
                return _wikipedia_fallback(query)

            d = summary_resp.json()
            return {
                "title":    d.get("displaytitle", title),
                "summary":  d.get("extract", "No summary available")[:1500],
                "url":      d.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "thumbnail":d.get("thumbnail", {}).get("source"),
                "related":  [r["title"] for r in results[1:]],
            }

    except Exception as e:
        return _wikipedia_fallback(query, error=str(e))


def _wikipedia_fallback(query: str, error: str = "") -> dict[str, Any]:
    """Return a note so the agent knows to rely on its training data."""
    return {
        "note": "Wikipedia unavailable — use your training knowledge for this query.",
        "query": query,
        "error": error,
        "suggestion": (
            f"Based on your training data, provide historical facts about '{query}'. "
            "Cite what you know and flag it as from training data."
        ),
    }


# ── NANO BANANA PRO — Google Imagen 3 ─────────────────────────
async def generate_image(
    prompt: str,
    style: str = "photorealistic",
    aspect_ratio: str = "16:9",
    subject: str = "history",
) -> dict[str, Any]:
    """
    Generate an accurate educational image using Imagen 4 Fast.
    Falls back to Gemini 2.5 Flash Image if Imagen 4 fails.
    Requires GOOGLE_AI_API_KEY in environment.
    """
    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if not api_key:
        return {
            "success": False,
            "error": "GOOGLE_AI_API_KEY not set",
            "prompt_ready": _build_enhanced_prompt(prompt, style, aspect_ratio, subject),
        }

    enhanced = _build_enhanced_prompt(prompt, style, aspect_ratio, subject)
    ar_map = {"16:9": "16:9", "1:1": "1:1", "4:3": "4:3", "9:16": "9:16"}
    ar = ar_map.get(aspect_ratio, "16:9")

    # Try Imagen 4 Fast first ($0.02/image, predict endpoint)
    result = await _try_imagen4(api_key, enhanced, ar)
    if result.get("success"):
        return result

    # Fall back to Gemini 2.5 Flash Image (generateContent endpoint)
    result = await _try_gemini_image(api_key, enhanced, "gemini-2.5-flash-image")
    if result.get("success"):
        return result

    # Fall back to Gemini 3 Pro Image
    result = await _try_gemini_image(api_key, enhanced, "gemini-3-pro-image-preview")
    if result.get("success"):
        return result

    # All failed — return prompt ready for manual generation
    return {
        "success": False,
        "error": result.get("error", "All image models unavailable"),
        "prompt_ready": enhanced,
        "note": "Prompts ready for manual generation in Google AI Studio",
    }


async def _try_imagen4(api_key: str, prompt: str, aspect_ratio: str) -> dict[str, Any]:
    """Try Imagen 4 Fast via predict endpoint."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={api_key}",
                json={
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": aspect_ratio,
                        "safetyFilterLevel": "block_few",
                        "personGeneration": "allow_adult",
                    },
                },
                headers={"Content-Type": "application/json"},
                timeout=60.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                preds = data.get("predictions", [])
                if preds and preds[0].get("bytesBase64Encoded"):
                    return {
                        "success": True,
                        "image_b64": preds[0]["bytesBase64Encoded"],
                        "mime_type": "image/png",
                        "prompt_used": prompt,
                        "model": "Imagen 4 Fast",
                    }
            return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def _try_gemini_image(api_key: str, prompt: str, model: str) -> dict[str, Any]:
    """Try Gemini image models via generateContent endpoint."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
                },
                headers={"Content-Type": "application/json"},
                timeout=60.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                for part in parts:
                    if part.get("inlineData", {}).get("data"):
                        return {
                            "success": True,
                            "image_b64": part["inlineData"]["data"],
                            "mime_type": part["inlineData"].get("mimeType", "image/png"),
                            "prompt_used": prompt,
                            "model": model,
                        }
            return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _build_enhanced_prompt(prompt: str, style: str, aspect_ratio: str, subject: str = "history") -> str:
    subject_context = {
        "history": (
            "Historical illustration for the Severus Learning Platform. "
            "Accurate period clothing, architecture and artifacts. No anachronisms. "
            "Diverse representation of the peoples depicted. "
        ),
        "science": (
            "Scientific diagram or illustration for the Severus Learning Platform. "
            "Accurate, clear, educational. "
        ),
        "econ": (
            "Economic illustration or infographic for the Severus Learning Platform. "
            "Clear, informative, modern. "
        ),
        "law": (
            "Legal illustration for the Severus Learning Platform. "
            "Professional, clear, educational. "
        ),
    }.get(subject, "Educational illustration for the Severus Learning Platform. ")

    return (
        f"{subject_context}"
        f"Style: {style}, cinematographic lighting, highly detailed. "
        f"Aspect ratio: {aspect_ratio}.\n\n"
        f"Scene: {prompt}"
    )


# ── VEO 3.1 VIDEO GENERATION ─────────────────────────────────

# ── NODE IMAGE FETCHER ────────────────────────────────────────
# Priority chain for each node on the PI board:
# 1. Wikipedia page thumbnail  (free, reliable, historically accurate)
# 2. Wikimedia Commons search  (CC-licensed photos and illustrations)
# 3. Imagen 4 Fast             (AI-generated fallback)

async def fetch_node_image(node_label: str, node_type: str = "event") -> dict[str, Any]:
    """
    Fetch the best available image for a PI board node.
    Returns: { image_url, image_b64, source, success }
    """

    # ── Step 1: Wikipedia thumbnail ───────────────────────────
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{node_label.replace(' ', '_')}",
                timeout=6.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                thumb = data.get("thumbnail", {}).get("source", "")
                if thumb:
                    return {
                        "success":    True,
                        "image_url":  thumb,
                        "image_b64":  None,
                        "source":     "wikipedia",
                        "alt":        data.get("description", node_label),
                    }
    except Exception:
        pass

    # ── Step 2: Wikimedia Commons search ──────────────────────
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action":        "query",
                    "generator":     "search",
                    "gsrsearch":     f"filetype:bitmap {node_label}",
                    "gsrlimit":      3,
                    "prop":          "imageinfo",
                    "iiprop":        "url|mime",
                    "iiurlwidth":    600,
                    "format":        "json",
                    "origin":        "*",
                },
                timeout=8.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                for page in pages.values():
                    info = page.get("imageinfo", [{}])[0]
                    mime = info.get("mime", "")
                    url  = info.get("thumburl") or info.get("url", "")
                    if url and "image" in mime:
                        return {
                            "success":   True,
                            "image_url": url,
                            "image_b64": None,
                            "source":    "wikimedia",
                            "alt":       node_label,
                        }
    except Exception:
        pass

    # ── Step 3: Imagen 4 AI generation ────────────────────────
    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if api_key:
        prompt = (
            f"Historical educational illustration of {node_label}. "
            f"Accurate period setting, diverse representation, documentary quality. "
            f"No text overlays. Clean composition suitable for an educational research tool."
        )
        result = await _try_imagen4(api_key, prompt, "4:3")
        if result.get("success"):
            return {
                "success":   True,
                "image_url": None,
                "image_b64": result["image_b64"],
                "mime_type": result.get("mime_type", "image/png"),
                "source":    "ai_generated",
                "alt":       node_label,
            }

    return {
        "success":   False,
        "image_url": None,
        "image_b64": None,
        "source":    "none",
        "alt":       node_label,
    }


# ── VIDEO GENERATION — HALTED ─────────────────────────────────
# Video generation is paused pending a longer-form video tool.
# Code preserved below for future re-enablement.
#
# async def generate_video_prompt(scene_description, duration="30 seconds"):
#     ...Veo 3.1 implementation removed...