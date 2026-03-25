"""
Severus Knowledge Base Tool
Provides structured access to all Severus data — locations, people, timeline events, migrations.
"""

from typing import Any

# ── LOCATIONS ─────────────────────────────────────────────────
LOCATIONS = [
    {"id": "rift", "name": "Great Rift Valley", "region": "East Africa", "type": "origin", "era": "315,000 BCE",
     "facts": ["Omo remains: oldest confirmed Homo sapiens, 195,000 BCE", "Lucy (3.2M years old) found at Hadar, Ethiopia", "Africa holds more genetic diversity than rest of world combined", "First stone tools created here 2.6 million years ago"],
     "connections": ["egypt", "kush", "hadza"]},
    {"id": "kush", "name": "Kingdom of Kush", "region": "Sudan", "type": "civilization", "era": "2500 BCE",
     "facts": ["200+ pyramids — more than Egypt", "25th Dynasty: Nubian Black Pharaohs ruled Egypt 744–656 BCE", "Meroitic script: Africa's earliest independent writing system", "Major iron-smelting hub"],
     "connections": ["egypt", "mali", "berlin"]},
    {"id": "egypt", "name": "Ancient Egypt — Kemet", "region": "North Africa", "type": "civilization", "era": "3100 BCE",
     "facts": ["Kemet = 'the Black Land'", "Great Pyramid: tallest structure on Earth for 3,800 years", "Ebers Papyrus: world's oldest medical text", "Egyptian theology shaped Greek, Roman and Christian traditions"],
     "connections": ["kush", "rift", "lloyds"]},
    {"id": "mali", "name": "Mali Empire & Timbuktu", "region": "West Africa", "type": "civilization", "era": "1235 CE",
     "facts": ["Mansa Musa I: likely wealthiest individual in recorded history", "1324 Mecca pilgrimage crashed gold markets for 10 years", "700,000+ manuscripts in Timbuktu libraries", "Controlled 50%+ of world's gold supply"],
     "connections": ["songhai", "yoruba", "rac", "ouidah"]},
    {"id": "benin", "name": "Kingdom of Benin", "region": "Nigeria", "type": "civilization", "era": "1180 CE",
     "facts": ["Benin Bronzes: 13th-century bronze casting rivalling Renaissance Europe", "Diplomatic contact with Portugal from 1485 CE", "1897 British Punitive Expedition: 3,000+ artworks looted"],
     "connections": ["yoruba", "rac", "lloyds", "ouidah"]},
    {"id": "caribbean", "name": "Caribbean — Haiti", "region": "Caribbean", "type": "diaspora", "era": "1503 CE",
     "facts": ["Haiti: first Black republic in history, January 1, 1804", "Only successful slave revolution in history", "Defeated Napoleon's professional army"],
     "connections": ["ouidah", "rac", "yoruba", "usa"]},
    {"id": "rac", "name": "Royal African Company", "region": "London", "type": "accountability", "era": "1660 CE",
     "facts": ["Duke of York (King James II) was its governor", "Transported 100,000+ enslaved Africans", "Held monopoly on English slave trade 1672–1698"],
     "connections": ["lloyds", "ouidah", "berlin", "caribbean", "usa"]},
    {"id": "lloyds", "name": "Lloyd's of London", "region": "London", "type": "accountability", "era": "1688 CE",
     "facts": ["Insured enslaved people as property", "Acknowledged its role publicly in 2020", "Still one of world's largest insurance markets"],
     "connections": ["rac", "berlin", "ouidah"]},
    {"id": "berlin", "name": "Berlin Conference 1884", "region": "Germany", "type": "accountability", "era": "1884 CE",
     "facts": ["14 European nations divided Africa — zero African representation", "Created 54 artificial borders splitting 177 ethnic groups", "Triggered colonial rule of 90% of Africa within 30 years"],
     "connections": ["leopold", "rac", "lloyds"]},
    {"id": "leopold", "name": "Belgian Congo — Leopold II", "region": "Congo", "type": "accountability", "era": "1885 CE",
     "facts": ["Leopold personally owned Congo as private property", "~10 million Congolese killed — first genocide of 20th century", "Hands cut off as punishment for failing rubber quotas"],
     "connections": ["berlin", "rac"]},
    {"id": "ouidah", "name": "Ouidah — Door of No Return", "region": "Benin, West Africa", "type": "accountability", "era": "1500 CE",
     "facts": ["Over 1 million enslaved people departed through Ouidah", "'Door of No Return' — last point of African soil", "Connected to Kingdom of Dahomey"],
     "connections": ["rac", "lloyds", "caribbean", "brazil", "usa"]},
]

# ── PEOPLE ────────────────────────────────────────────────────
PEOPLE = [
    {"id": "mansa-musa", "name": "Mansa Musa I", "dates": "c.1280–1337", "role": "Emperor, Mali Empire",
     "desc": "Likely the wealthiest person in all of recorded history. Controlled 50%+ of world's gold. His 1324 Mecca pilgrimage crashed Egypt's economy for a decade.",
     "connections": ["mali", "timbuktu", "trans-saharan-trade"]},
    {"id": "taharqa", "name": "Taharqa", "dates": "690–664 BCE", "role": "Nubian Pharaoh",
     "desc": "Greatest Nubian pharaoh of the 25th Dynasty. Ruled all of Egypt and Kush. Built more temples than any pharaoh since Ramesses II. Mentioned in the Bible.",
     "connections": ["kush", "egypt"]},
    {"id": "toussaint", "name": "Toussaint Louverture", "dates": "1743–1803", "role": "Revolutionary General",
     "desc": "Led the Haitian Revolution — the only successful slave revolt in history. Defeated armies of France, Spain and Britain.",
     "connections": ["caribbean", "rac", "ouidah"]},
    {"id": "nkrumah", "name": "Kwame Nkrumah", "dates": "1909–1972", "role": "President of Ghana, Pan-Africanist",
     "desc": "First President of Ghana. Led first sub-Saharan independence (1957). Father of Pan-Africanism.",
     "connections": ["berlin", "independence-movements"]},
    {"id": "sankara", "name": "Thomas Sankara", "dates": "1949–1987", "role": "President of Burkina Faso",
     "desc": "Renamed country from colonial name, launched mass literacy, planted 10M trees, vaccinated 2.5M children in one week. Assassinated, likely with French involvement.",
     "connections": ["berlin", "neo-colonialism"]},
    {"id": "imhotep", "name": "Imhotep", "dates": "c.2650 BCE", "role": "Architect, Physician",
     "desc": "First named architect and physician in history. Designed the Step Pyramid of Djoser. Later deified as god of medicine. Inspired Asclepius in Greek mythology.",
     "connections": ["egypt", "kush"]},
    {"id": "yaa-asantewaa", "name": "Yaa Asantewaa", "dates": "c.1840–1921", "role": "Queen Mother, War Leader",
     "desc": "Led the War of the Golden Stool (1900) against the British Empire. One of the last African rulers to wage war against colonialism.",
     "connections": ["berlin", "rac"]},
    {"id": "harriet-tubman", "name": "Harriet Tubman", "dates": "1822–1913", "role": "Liberator, Spy",
     "desc": "Born enslaved, made 13 missions to free ~70 people via Underground Railroad. Led first armed raid by a woman in US history.",
     "connections": ["usa", "rac", "ouidah"]},
]

# ── TIMELINE EVENTS ───────────────────────────────────────────
TIMELINE_EVENTS = [
    {"year": -315000, "title": "Homo Sapiens Emerge", "region": "Africa", "era": "origins",
     "desc": "First anatomically modern humans appear. Jebel Irhoud skulls (315,000 BCE), Omo remains (195,000 BCE).",
     "impact": "Origin of all 8 billion humans alive today."},
    {"year": -3100, "title": "Ancient Egypt Founded", "region": "North Africa", "era": "firstkings",
     "desc": "Narmer unifies Upper and Lower Egypt. The civilisation Egyptians called Kemet — the Black Land.",
     "impact": "3,000 years of civilisation that built the pyramids and invented formal mathematics."},
    {"year": -2500, "title": "Kingdom of Kush Rises", "region": "Sudan", "era": "firstkings",
     "desc": "Kush emerges as a major power, eventually building more pyramids than Egypt.",
     "impact": "Proved African civilisation did not begin and end at Egypt's borders."},
    {"year": 1324, "title": "Mansa Musa's Pilgrimage", "region": "West Africa", "era": "empires",
     "desc": "Mansa Musa travels to Mecca with 60,000 people, crashes Egypt's gold market for a decade.",
     "impact": "Remains the benchmark for the wealthiest person in all of history."},
    {"year": 1619, "title": "First Africans in English America", "region": "Virginia", "era": "slavetrade",
     "desc": "First enslaved Africans arrive at Point Comfort, Virginia.",
     "impact": "Start of African American history — 400 years of building America."},
    {"year": 1804, "title": "Haitian Revolution Succeeds", "region": "Haiti", "era": "slavetrade",
     "desc": "January 1, 1804: first Black republic, created by defeating Napoleon's army.",
     "impact": "Only successful slave revolt in human history."},
    {"year": 1884, "title": "Berlin Conference", "region": "Europe", "era": "colonial",
     "desc": "14 European powers divide Africa with zero African representation.",
     "impact": "These borders created today's African nations and contemporary conflicts."},
    {"year": 1897, "title": "Benin Bronzes Looted", "region": "Nigeria", "era": "colonial",
     "desc": "British forces loot over 3,000 bronze artworks from Kingdom of Benin.",
     "impact": "At the centre of the global repatriation debate today."},
    {"year": 1957, "title": "Ghana Independence", "region": "Ghana", "era": "independence",
     "desc": "Ghana becomes first sub-Saharan African country to gain independence under Nkrumah.",
     "impact": "Triggered wave of independence movements across the continent."},
]

# ── SEARCH FUNCTION ───────────────────────────────────────────
def search_knowledge_base(query: str, category: str = "all") -> dict[str, Any]:
    """
    Search the Severus knowledge base for locations, people, and events.
    Returns matching entries with their connections.
    """
    query_lower = query.lower()
    results = {"locations": [], "people": [], "events": [], "query": query}

    if category in ("all", "locations"):
        for loc in LOCATIONS:
            score = sum([
                3 if query_lower in loc["name"].lower() else 0,
                2 if query_lower in loc["region"].lower() else 0,
                2 if query_lower in loc["type"].lower() else 0,
                1 if any(query_lower in f.lower() for f in loc["facts"]) else 0,
            ])
            if score > 0:
                results["locations"].append({**loc, "_score": score})

    if category in ("all", "people"):
        for person in PEOPLE:
            score = sum([
                3 if query_lower in person["name"].lower() else 0,
                2 if query_lower in person["role"].lower() else 0,
                1 if query_lower in person["desc"].lower() else 0,
            ])
            if score > 0:
                results["people"].append({**person, "_score": score})

    if category in ("all", "events"):
        for event in TIMELINE_EVENTS:
            score = sum([
                3 if query_lower in event["title"].lower() else 0,
                2 if query_lower in event["region"].lower() else 0,
                1 if query_lower in event["desc"].lower() else 0,
                1 if query_lower in event["impact"].lower() else 0,
            ])
            if score > 0:
                results["events"].append({**event, "_score": score})

    # Sort by score
    for key in ("locations", "people", "events"):
        results[key] = sorted(results[key], key=lambda x: x["_score"], reverse=True)[:5]

    return results


def get_connections(node_id: str) -> dict[str, Any]:
    """
    Get all connections for a given node — useful for the Investigator's PI board tracing.
    """
    all_items = LOCATIONS + PEOPLE
    node = next((item for item in all_items if item["id"] == node_id), None)
    if not node:
        return {"error": f"Node '{node_id}' not found"}

    connections = []
    for conn_id in node.get("connections", []):
        connected = next((item for item in all_items if item["id"] == conn_id), None)
        if connected:
            connections.append({
                "id": connected["id"],
                "name": connected["name"],
                "type": connected.get("type", "unknown"),
                "era": connected.get("era", connected.get("dates", "")),
            })

    return {
        "node": {"id": node["id"], "name": node["name"]},
        "connections": connections,
        "connection_count": len(connections),
    }