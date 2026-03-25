"""
External API Tools for Severus Agents
- Wikipedia REST API (with fallback)
- SlaveVoyages.org API
- Google Imagen 3 via Nano Banana Pro
"""

import httpx
import os
import base64
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


# ── SLAVEVOYAGES ──────────────────────────────────────────────
async def search_slavevoyages(
    query: str = None,
    ship_name: str = None,
    flag: str = None,
    year_from: int = None,
    year_to: int = None,
) -> dict[str, Any]:
    """Query the SlaveVoyages.org database."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            params: dict = {"format": "json", "limit": 10}
            if ship_name:  params["ship_name"] = ship_name
            if flag:       params["nat_id"]    = flag
            if year_from:  params["year_from"] = year_from
            if year_to:    params["year_to"]   = year_to

            resp = await client.get(
                "https://www.slavevoyages.org/voyage/api/",
                params=params,
                headers={"Accept": "application/json"},
                timeout=15.0,
            )
            if resp.status_code == 200:
                raw = resp.text.strip()
                if not raw:
                    return _slavevoyages_curated()
                data = resp.json()
                voyages = data.get("results", [])
                return {
                    "total_found": data.get("count", 0),
                    "voyages": [{
                        "voyage_id":            v.get("id"),
                        "ship_name":            v.get("ship_name", "Unknown"),
                        "year_arrived":         v.get("year_arrived_at_port_of_dis"),
                        "captives_embarked":    v.get("total_embarked"),
                        "captives_disembarked": v.get("total_disembarked"),
                        "place_of_purchase":    v.get("place_of_landing"),
                        "flag":                 v.get("flag"),
                        "captain":              v.get("captain_name"),
                    } for v in voyages[:8]],
                    "source": "SlaveVoyages.org — Trans-Atlantic Slave Trade Database",
                }
            return _slavevoyages_curated()
    except Exception:
        return _slavevoyages_curated()


def _slavevoyages_curated() -> dict[str, Any]:
    return {
        "note": "Live API unavailable — returning curated records",
        "total_documented": 36000,
        "total_africans_transported": 12500000,
        "key_facts": [
            "36,000+ documented voyages in the Trans-Atlantic Slave Trade Database",
            "~12.5 million Africans transported across the Atlantic",
            "Brazil received 4.9 million — 46% of the entire trade",
            "Royal African Company transported 100,000+ between 1672–1698",
            "The Clotilda (1860) was the last documented slave ship to the USA",
            "Portugal/Brazil operated ~11,000 voyages — the most of any nation",
        ],
        "top_flag_nations": [
            {"flag": "Portugal/Brazil", "estimated_voyages": 11000},
            {"flag": "Britain",         "estimated_voyages": 11000},
            {"flag": "France",          "estimated_voyages": 4200},
            {"flag": "Netherlands",     "estimated_voyages": 2600},
            {"flag": "United States",   "estimated_voyages": 1500},
        ],
        "source": "SlaveVoyages.org — Trans-Atlantic Slave Trade Database",
        "url": "https://www.slavevoyages.org",
    }


# ── NANO BANANA PRO — Google Imagen 3 ─────────────────────────
async def generate_image(
    prompt: str,
    style: str = "photorealistic",
    aspect_ratio: str = "16:9",
) -> dict[str, Any]:
    """
    Generate a historical image using Imagen 4 Fast.
    Falls back to Gemini 2.5 Flash Image if Imagen 4 fails.
    Requires GOOGLE_AI_API_KEY in environment.
    """
    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if not api_key:
        return {
            "success": False,
            "error": "GOOGLE_AI_API_KEY not set",
            "prompt_ready": _build_enhanced_prompt(prompt, style, aspect_ratio),
        }

    enhanced = _build_enhanced_prompt(prompt, style, aspect_ratio)
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


def _build_enhanced_prompt(prompt: str, style: str, aspect_ratio: str) -> str:
    return (
        f"Historical illustration for the Severus African History Platform. "
        f"Style: {style}, cinematographic lighting, highly detailed, educational. "
        f"Aspect ratio: {aspect_ratio}.\n\n"
        f"Scene: {prompt}\n\n"
        f"Cultural accuracy: Depict African people with diverse skin tones and authentic "
        f"period-appropriate clothing, architecture and artifacts. No anachronisms."
    )


# ── VEO 3.1 VIDEO GENERATION ─────────────────────────────────
async def generate_video_prompt(
    scene_description: str,
    duration: str = "30 seconds",
) -> dict[str, Any]:
    """
    Generate a video using Veo 3.1 (generates with audio).
    Falls back to a structured text prompt if API fails.
    """
    api_key = os.getenv("GOOGLE_AI_API_KEY")

    if api_key:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Start video generation job
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideo?key={api_key}",
                    json={
                        "prompt": {
                            "text": (
                                f"Historical documentary reconstruction for the Severus African History Platform. "
                                f"BBC/National Geographic quality. "
                                f"Scene: {scene_description} "
                                f"Style: Cinematic, photorealistic. "
                                f"Cultural accuracy: authentic African period clothing, architecture, and artifacts."
                            )
                        },
                        "generationConfig": {
                            "durationSeconds": 8,
                            "aspectRatio": "16:9",
                            "fps": 24,
                        },
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=120.0,
                )

                if resp.status_code == 200:
                    data = resp.json()
                    # Veo returns an operation name — poll for result
                    operation_name = data.get("name", "")
                    if operation_name:
                        video_result = await _poll_video_operation(client, api_key, operation_name)
                        if video_result.get("success"):
                            return video_result

                # If Veo fails, return structured prompt
                return _veo_text_prompt(scene_description, duration)

        except Exception as e:
            pass  # Fall through to text prompt

    return _veo_text_prompt(scene_description, duration)


async def _poll_video_operation(
    client: httpx.AsyncClient,
    api_key: str,
    operation_name: str,
    max_polls: int = 10,
) -> dict[str, Any]:
    """Poll Veo operation until complete."""
    import asyncio
    for _ in range(max_polls):
        await asyncio.sleep(5)
        resp = await client.get(
            f"https://generativelanguage.googleapis.com/v1beta/{operation_name}?key={api_key}",
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("done"):
                videos = data.get("response", {}).get("generatedVideos", [])
                if videos and videos[0].get("video", {}).get("uri"):
                    return {
                        "success": True,
                        "video_uri": videos[0]["video"]["uri"],
                        "model": "Veo 3.1",
                        "has_audio": True,
                    }
    return {"success": False, "error": "Video generation timed out"}


def _veo_text_prompt(scene_description: str, duration: str) -> dict[str, Any]:
    """Structured video prompt for manual use with Veo 3.1 or Runway ML."""
    return {
        "success": False,
        "type": "video_prompt",
        "video_prompt": (
            f"HISTORICAL VIDEO RECONSTRUCTION — SEVERUS PLATFORM\n\n"
            f"Scene: {scene_description}\n"
            f"Duration: {duration}\n"
            f"Model: Veo 3.1 (veo-3.1-generate-preview) — includes synchronized audio\n"
            f"Style: Documentary-cinematic, photorealistic, BBC/National Geographic quality\n\n"
            f"Camera: Aerial establishing shot → ground-level → close-ups on faces and artifacts\n"
            f"Lighting: Golden hour, dramatic natural lighting\n"
            f"Audio: African traditional instruments, ambient period sounds (Veo 3.1 auto-generates)\n\n"
            f"Cultural accuracy:\n"
            f"- Authentic African clothing and hairstyles for the period\n"
            f"- Correct architecture (no anachronistic Western elements)\n"
            f"- Diverse skin tones and facial features\n"
            f"- Accurate tools, weapons, trade goods\n\n"
            f"Voiceover: Authoritative, respectful, documentary narration"
        ),
        "recommended_tool": "Google Veo 3.1 (veo-3.1-generate-preview) or Runway ML",
        "veo_model": "veo-3.1-generate-preview",
        "note": "Paste this prompt into Google AI Studio with Veo 3.1 for video + audio generation",
    }