/**
 * Severus Research Section — clean agent output cards
 * Tool calls hidden by default, togglable via "Show reasoning"
 * Images rendered inline from base64
 */

import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AGENTS = {
  historian:    { label:"The Historian",    icon:"📜", color:"#009AD8", desc:"Searches Wikipedia & Severus KB for verified historical facts" },
  investigator: { label:"The Investigator", icon:"🔍", color:"#E03030", desc:"Traces connections — follows money, lineage, and accountability chains" },
  visualizer:   { label:"The Visualizer",   icon:"🎨", color:"#9B59B6", desc:"Generates images via Imagen 4 & creates video prompts" },
  guide:        { label:"The Guide",        icon:"🧭", color:"#4CAF7D", desc:"Synthesizes everything into a narrative journey" },
};

const AGENT_ORDER = ["historian", "investigator", "visualizer", "guide"];

const SUGGESTIONS = [
  "Tell me about the Egyptian pyramids and their African origins",
  "Who financed the transatlantic slave trade?",
  "What was the Kingdom of Mali and why isn't it taught in schools?",
  "Trace the journey of the Benin Bronzes from Nigeria to British museums",
  "How did the Haitian Revolution defeat Napoleon's army?",
  "What did Timbuktu look like at its peak under Mansa Musa?",
];

// ── Agent graph node ──────────────────────────────────────────
function AgentNode({ agentId, status, T }) {
  const agent = AGENTS[agentId];
  const isActive  = status === "active";
  const isDone    = status === "done";
  const isPending = status === "pending";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:isPending?0.3:1, transition:"all 0.4s", transform:isActive?"scale(1.06)":"scale(1)" }}>
      <div style={{ width:52, height:52, borderRadius:"50%", background:isDone||isActive?agent.color+"25":T.card, border:`2px solid ${isDone||isActive?agent.color:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, position:"relative", boxShadow:isActive?`0 0 18px ${agent.color}50`:"none", transition:"all 0.4s" }}>
        {agent.icon}
        {isDone && <div style={{ position:"absolute", bottom:-2, right:-2, width:16, height:16, borderRadius:"50%", background:agent.color, border:`2px solid ${T.bg}`, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>✓</div>}
        {isActive && <div style={{ position:"absolute", inset:-5, borderRadius:"50%", border:`2px solid ${agent.color}60`, animation:"pulse-ring 1.4s ease-out infinite" }}/>}
      </div>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, color:isDone||isActive?agent.color:T.inkLight, letterSpacing:"0.04em" }}>
        {agent.label.replace("The ","")}
      </span>
    </div>
  );
}

// ── Clean agent output card ───────────────────────────────────
function AgentOutputCard({ agentId, content, toolCalls, showReasoning, T }) {
  const [expanded, setExpanded] = useState(false);
  const agent = AGENTS[agentId];
  if (!agent || !content) return null;

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${agent.color}`, borderRadius:10, marginBottom:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:`1px solid ${T.border}` }}>
        <span style={{ fontSize:18 }}>{agent.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:agent.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>{agent.label}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>{agent.desc}</div>
        </div>
        {showReasoning && toolCalls?.length > 0 && (
          <button onClick={()=>setExpanded(e=>!e)} style={{ padding:"4px 10px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:20, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight, cursor:"pointer" }}>
            {expanded?"Hide":"Show"} {toolCalls.length} tool call{toolCalls.length>1?"s":""}
          </button>
        )}
      </div>

      {/* Tool calls (collapsed by default) */}
      {showReasoning && expanded && toolCalls?.length > 0 && (
        <div style={{ background:T.name==="dark"?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.03)", borderBottom:`1px solid ${T.border}`, padding:"10px 14px", maxHeight:220, overflowY:"auto" }}>
          {toolCalls.map((tc, i) => (
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <div style={{ padding:"1px 7px", borderRadius:20, background:agent.color+"20", fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, color:agent.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {tc.type === "tool_call" ? `tool: ${tc.tool_name}` : "result"}
                </div>
              </div>
              <div style={{ fontFamily:"monospace", fontSize:10, color:T.inkMid, background:T.surface, borderRadius:6, padding:"6px 8px", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
                {tc.type === "tool_call" ? JSON.stringify(tc.tool_input, null, 2) : tc.content?.slice(0, 300)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main output */}
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.ink, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Image display card ────────────────────────────────────────
function ImageCard({ image, index, T }) {
  const [enlarged, setEnlarged] = useState(false);
  const src = image.image_b64 ? `data:${image.mime_type||"image/png"};base64,${image.image_b64}` : null;
  if (!src) return null;

  return (
    <>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:"3px solid #9B59B6", borderRadius:10, marginBottom:14, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontSize:16 }}>🎨</span>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9B59B6", textTransform:"uppercase", letterSpacing:"0.08em" }}>Generated Image · Scene {index+1}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>Imagen 4 Fast · {image.model||"Nano Banana Pro"}</div>
          </div>
        </div>
        <div style={{ cursor:"pointer" }} onClick={()=>setEnlarged(true)}>
          <img src={src} alt={`Generated scene ${index+1}`} style={{ width:"100%", maxHeight:320, objectFit:"cover", display:"block" }}/>
        </div>
        {(image.prompt_used || image.prompt) && (
          <div style={{ padding:"8px 14px", borderTop:`1px solid ${T.border}` }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight, margin:0, fontStyle:"italic", lineHeight:1.5 }}>
              {(image.prompt_used || image.prompt || "").slice(0,160)}…
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {enlarged && (
        <div onClick={()=>setEnlarged(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={src} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:8, boxShadow:"0 20px 60px rgba(0,0,0,0.8)" }}/>
          <div style={{ position:"absolute", top:20, right:24, color:"rgba(255,255,255,0.6)", fontSize:24, cursor:"pointer" }}>✕</div>
        </div>
      )}
    </>
  );
}

// ── Video prompt card ─────────────────────────────────────────
function VideoCard({ data, T }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:"3px solid #9B59B6", borderRadius:10, marginBottom:14, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🎬</span>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9B59B6", textTransform:"uppercase", letterSpacing:"0.08em" }}>Video Prompt · Veo 3.1</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>Paste into Google AI Studio → Veo 3.1 for 8-sec clip with audio</div>
          </div>
        </div>
        <button onClick={()=>setExpanded(e=>!e)} style={{ padding:"4px 10px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:20, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight, cursor:"pointer" }}>
          {expanded?"Hide":"Show"} prompt
        </button>
      </div>
      {expanded && (
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}`, background:T.name==="dark"?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.02)" }}>
          <pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, lineHeight:1.65, whiteSpace:"pre-wrap", margin:0 }}>{data.video_prompt}</pre>
        </div>
      )}
    </div>
  );
}

// ── Narrative output ──────────────────────────────────────────
function NarrativeCard({ narrative, depth, T }) {
  if (!narrative) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderTop:"3px solid #4CAF7D", borderRadius:10, padding:"20px 22px", marginTop:4 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <span style={{ fontSize:20 }}>🧭</span>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#4CAF7D", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            The Guide — {depth==="teaser"?"Story Teaser":"Deep Dive"}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>Synthesized from all 4 agents</div>
        </div>
      </div>
      <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:14, color:T.ink, lineHeight:1.9, whiteSpace:"pre-wrap" }}>
        {narrative}
      </div>
    </div>
  );
}

// ── Parse investigator tool results into PI board nodes/edges ─
function parseConnectionsForBoard(toolCalls, question) {
  const nodeMap = new Map();   // label → node
  const edges   = [];
  let nextId    = Date.now();

  const typeGuess = (name, nodeType) => {
    if (nodeType === "accountability") return "institution";
    if (nodeType === "diaspora")       return "place";
    if (nodeType === "civilization")   return "place";
    if (nodeType === "origin")         return "place";
    if (nodeType === "indigenous")     return "person";
    const n = name.toLowerCase();
    if (n.includes("company") || n.includes("bank") || n.includes("lloyd") || n.includes("university")) return "institution";
    if (n.includes("ship") || n.includes("clotilda") || n.includes("zong") || n.includes("brooks")) return "ship";
    if (n.includes("conference") || n.includes("revolution") || n.includes("war") || n.includes("act")) return "event";
    if (n.includes("trade") || n.includes("route") || n.includes("passage")) return "trade";
    return "place";
  };

  const addNode = (id, name, ntype) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        id: id,
        label: name,
        type: typeGuess(name, ntype),
        x: 150 + (nodeMap.size % 5) * 200 + Math.random() * 60,
        y: 120 + Math.floor(nodeMap.size / 5) * 180 + Math.random() * 40,
      });
    }
    return nodeMap.get(id);
  };

  // Walk through tool results from the investigator
  for (const tc of toolCalls) {
    if (tc.type !== "tool_result") continue;
    try {
      const parsed = JSON.parse(tc.content?.replace(/\.\.\.$/,"") || "{}");

      // get_node_connections result
      if (parsed.node && parsed.connections) {
        const root = addNode(parsed.node.id, parsed.node.name, "");
        for (const conn of parsed.connections) {
          const child = addNode(conn.id, conn.name, conn.type);
          const pairKey = [root.id, child.id].sort().join("-");
          if (!edges.find(e => [e.from, e.to].sort().join("-") === pairKey)) {
            edges.push({
              id: nextId++,
              from: root.id,
              to: child.id,
              label: conn.type === "accountability" ? "Implicated" : conn.type === "diaspora" ? "Connected to" : "Linked to",
            });
          }
        }
      }
    } catch {}
  }

  // Always add the question topic as a node if we have results
  if (nodeMap.size > 0 && question) {
    const topicId = "topic-" + Date.now();
    const words   = question.replace(/[^a-zA-Z\s]/g,"").split(" ").filter(w=>w.length>3);
    const label   = words.slice(0,3).join(" ") || "Research Topic";
    if (!nodeMap.has(topicId)) {
      nodeMap.set(topicId, { id: topicId, label, type: "event", x: 500, y: 50 });
    }
    // Connect first real node to topic
    const firstNode = [...nodeMap.values()][0];
    if (firstNode.id !== topicId) {
      edges.unshift({ id: nextId++, from: topicId, to: firstNode.id, label: "Relates to" });
    }
  }

  return { nodes: [...nodeMap.values()], edges };
}

// ── Main Research Section ─────────────────────────────────────
export default function ResearchSection({ T, onPushToBoard, onNavigate, savedState, onSaveState }) {
  const [question,       setQuestion]       = useState(savedState?.question || "");
  const [depth,          setDepth]          = useState(savedState?.depth    || "teaser");
  const [showReasoning,  setShowReasoning]  = useState(false);
  const [running,        setRunning]        = useState(false);
  const [hasRun,         setHasRun]         = useState(savedState?.hasRun   || false);

  const [agentStatuses,  setAgentStatuses]  = useState(
    savedState?.agentStatuses || { historian:"pending", investigator:"pending", visualizer:"pending", guide:"pending" }
  );
  const [agentOutputs,   setAgentOutputs]   = useState(
    savedState?.agentOutputs  || { historian:"", investigator:"", visualizer:"", guide:"" }
  );
  const [agentToolCalls, setAgentToolCalls] = useState(
    savedState?.agentToolCalls || { historian:[], investigator:[], visualizer:[] }
  );
  const [images,    setImages]    = useState(savedState?.images    || []);
  const [videos,    setVideos]    = useState(savedState?.videos    || []);
  const [narrative, setNarrative] = useState(savedState?.narrative || null);
  const [error,     setError]     = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [agentOutputs, images, narrative]);

  // Save to parent when run completes (narrative arriving = done)
  useEffect(() => {
    if (!narrative || !onSaveState) return;
    onSaveState({ question, depth, hasRun:true, agentStatuses, agentOutputs, agentToolCalls, images, videos, narrative });
  }, [narrative]);

  const runAgents = async (q) => {
    if (!q.trim() || running) return;

    // Reset
    setRunning(true);
    setHasRun(true);
    setError(null);
    setImages([]);
    setVideos([]);
    setNarrative(null);
    setAgentOutputs({ historian:"", investigator:"", visualizer:"", guide:"" });
    setAgentStatuses({ historian:"pending", investigator:"pending", visualizer:"pending", guide:"pending" });
    setAgentToolCalls({ historian:[], investigator:[], visualizer:[] });

    try {
      const res = await fetch(`${API_URL}/research/stream`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: q, narrative_depth: depth, show_reasoning: showReasoning }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Server ${res.status}: ${txt.slice(0,120)}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE events are separated by \n\n
        const blocks = buf.split(/\n\n/);
        buf = blocks.pop() ?? "";

        for (const block of blocks) {
          let etype = "";
          let dline = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) etype = line.slice(7).trim();
            if (line.startsWith("data: "))  dline = line.slice(6).trim();
          }
          if (!dline) continue;

          let data;
          try { data = JSON.parse(dline); } catch { continue; }

          // ── Route events ────────────────────────────────────
          if (etype === "image_generated" || data.image_b64) {
            setImages(p => [...p, {
              image_b64:   data.image_b64,
              mime_type:   data.mime_type   || "image/png",
              prompt_used: data.prompt      || data.prompt_used || "",
              model:       data.model       || "Imagen 4 Fast",
            }]);
            setAgentStatuses(p => ({ ...p, visualizer:"done" }));
            continue;
          }

          if (etype === "video_prompt" || data.video_prompt) {
            setVideos(p => [...p, data]);
            continue;
          }

          if (etype === "narrative" || data.narrative) {
            setNarrative(data.narrative);
            setAgentStatuses(p => ({ ...p, guide:"done" }));
            continue;
          }

          if (data.error && !data.agent) {
            setError(data.error);
            continue;
          }

          // Agent events
          if (data.agent && data.type) {
            const ag = data.agent;
            if (data.type === "thinking") {
              setAgentStatuses(p => ({ ...p, [ag]:"active" }));
            }
            if (data.type === "output") {
              setAgentOutputs(p => ({ ...p, [ag]: data.content }));
              setAgentStatuses(p => ({ ...p, [ag]:"done" }));
            }
            if (data.type === "tool_call" || data.type === "tool_result") {
              setAgentToolCalls(p => ({ ...p, [ag]: [...(p[ag]||[]), data] }));
            }
          }
        }
      }
    } catch (e) {
      setError(e.message || "Connection failed — is the backend running at " + API_URL + "?");
    } finally {
      setRunning(false);
    }
  };

  const activeAgent = AGENT_ORDER.find(a => agentStatuses[a] === "active");


  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg, overflow:"hidden" }}>
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>

      {/* ── Controls bar ─────────────────────────────────────── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"9px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
        {/* Depth */}
        <div style={{ display:"flex", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
          {[["teaser","📋 Teaser"],["deep_dive","📖 Deep Dive"]].map(([v,l])=>(
            <button key={v} onClick={()=>setDepth(v)} style={{ padding:"6px 14px", background:depth===v?T.accent:"transparent", border:"none", color:depth===v?"#fff":T.inkMid, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:depth===v?600:400, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
          ))}
        </div>

        {/* Reasoning toggle */}
        <div onClick={()=>setShowReasoning(v=>!v)} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px", background:showReasoning?T.info+"18":T.card, border:`1px solid ${showReasoning?T.info+"50":T.border}`, borderRadius:8, cursor:"pointer", transition:"all 0.2s" }}>
          <div style={{ width:14, height:14, borderRadius:3, background:showReasoning?T.info:"transparent", border:`1.5px solid ${showReasoning?T.info:T.inkFaint}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }}>
            {showReasoning&&"✓"}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:showReasoning?T.info:T.inkMid }}>Show reasoning</span>
        </div>

        <div style={{ flex:1 }}/>

        {/* Live agent indicators */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {AGENT_ORDER.map(id => {
            const st = agentStatuses[id];
            const ag = AGENTS[id];
            return (
              <div key={id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:st==="done"?ag.color:st==="active"?ag.color:"transparent", border:`1.5px solid ${st==="pending"?T.inkFaint:ag.color}`, transition:"all 0.3s", boxShadow:st==="active"?`0 0 6px ${ag.color}`:"none" }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:st==="pending"?T.inkFaint:ag.color }}>{ag.label.replace("The ","")}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── Main output area ─────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Agent graph */}
          <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"14px 24px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0 }}>
              {AGENT_ORDER.map((id, i) => (
                <div key={id} style={{ display:"flex", alignItems:"center" }}>
                  <AgentNode agentId={id} status={agentStatuses[id]} T={T}/>
                  {i < AGENT_ORDER.length-1 && (
                    <div style={{ width:36, height:2, margin:"0 6px", marginBottom:18, background:agentStatuses[AGENT_ORDER[i+1]]!=="pending"?AGENTS[AGENT_ORDER[i+1]].color+"40":T.border, transition:"background 0.4s" }}/>
                  )}
                </div>
              ))}
            </div>
            {activeAgent && (
              <div style={{ textAlign:"center", marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:AGENTS[activeAgent].color }}>
                <span style={{ display:"inline-block", animation:"spin 1.2s linear infinite", marginRight:6 }}>⟳</span>
                {AGENTS[activeAgent].label} is working…
              </div>
            )}
          </div>

          {/* Scrollable output */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

            {/* Empty state */}
            {!hasRun && (
              <div style={{ textAlign:"center", paddingTop:40 }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🌍</div>
                <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:T.ink, margin:"0 0 8px" }}>4 AI Agents. 300,000 Years of History.</h3>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.inkMid, maxWidth:480, margin:"0 auto 28px", lineHeight:1.7 }}>
                  The Historian finds facts. The Investigator traces connections. The Visualizer generates images. The Guide weaves it all into a story.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:560, margin:"0 auto" }}>
                  {SUGGESTIONS.map((s,i)=>(
                    <div key={i} onClick={()=>{ setQuestion(s); runAgents(s); }}
                      style={{ padding:"12px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, lineHeight:1.5, textAlign:"left", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"50";e.currentTarget.style.color=T.ink;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkMid;}}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding:"14px 16px", background:T.danger+"15", border:`1px solid ${T.danger}40`, borderRadius:8, marginBottom:14 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:T.danger, marginBottom:4 }}>Error</div>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, margin:0 }}>{error}</p>
              </div>
            )}

            {/* Agent output cards — clean, no tool calls by default */}
            {AGENT_ORDER.filter(id => id !== "guide").map(id => (
              agentOutputs[id] ? (
                <AgentOutputCard
                  key={id}
                  agentId={id}
                  content={agentOutputs[id]}
                  toolCalls={agentToolCalls[id]}
                  showReasoning={showReasoning}
                  T={T}
                />
              ) : agentStatuses[id] === "active" ? (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${AGENTS[id].color}`, borderRadius:10, marginBottom:14 }}>
                  <span style={{ fontSize:18 }}>{AGENTS[id].icon}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:AGENTS[id].color }}>{AGENTS[id].label} is researching…</span>
                  <div style={{ display:"flex", gap:4, marginLeft:4 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:AGENTS[id].color, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                  </div>
                </div>
              ) : null
            ))}

            {/* Generated images — displayed inline */}
            {images.map((img, i) => <ImageCard key={i} image={img} index={i} T={T}/>)}

            {/* Video prompts */}
            {videos.map((vid, i) => <VideoCard key={i} data={vid} T={T}/>)}

            {/* Guide loading indicator */}
            {agentStatuses.guide === "active" && !narrative && (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid #4CAF7D`, borderRadius:10, marginBottom:14 }}>
                <span style={{ fontSize:18 }}>🧭</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4CAF7D" }}>The Guide is weaving the narrative…</span>
                <div style={{ display:"flex", gap:4, marginLeft:4 }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#4CAF7D", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}

            {/* Final narrative */}
            <NarrativeCard narrative={narrative} depth={depth} T={T}/>

            {/* ── Map to PI Board button ─────────────────────── */}
            {narrative && onPushToBoard && (
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 20px", marginTop:14, display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.ink, marginBottom:4 }}>
                    Map these connections to the PI Board
                  </div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, margin:0, lineHeight:1.6 }}>
                    The Investigator traced {agentToolCalls.investigator?.filter(t=>t.type==="tool_result").length||0} connection{agentToolCalls.investigator?.filter(t=>t.type==="tool_result").length!==1?"s":""}.
                    Add them as nodes to the PI board — then extend the investigation manually.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const { nodes: newNodes, edges: newEdges } = parseConnectionsForBoard(
                      agentToolCalls.investigator || [],
                      question
                    );
                    if (newNodes.length > 0) {
                      onPushToBoard(newNodes, newEdges);
                      onNavigate("investigate");
                    }
                  }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:T.slate+"22", border:`1px solid ${T.slate}50`, borderRadius:8, color:T.ink, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=T.slate+"22";e.currentTarget.style.borderColor=T.slate+"50";e.currentTarget.style.color=T.ink;}}
                >
                  🔍 Open PI Board →
                </button>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div style={{ width:230, borderLeft:`1px solid ${T.border}`, background:T.surface, overflowY:"auto", flexShrink:0 }}>
          <div style={{ padding:"14px 14px 8px", fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600 }}>Agents</div>
          {AGENT_ORDER.map(id => {
            const ag = AGENTS[id];
            const st = agentStatuses[id];
            return (
              <div key={id} style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, opacity:st==="pending"?0.4:1, transition:"opacity 0.3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{ag.icon}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:st!=="pending"?ag.color:T.inkMid }}>{ag.label}</span>
                </div>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkLight, lineHeight:1.55, margin:"0 0 6px" }}>{ag.desc}</p>
                <div style={{ padding:"2px 8px", borderRadius:20, background:st==="done"?ag.color+"20":st==="active"?ag.color+"30":T.card, border:`1px solid ${st==="pending"?T.border:ag.color+"50"}`, display:"inline-block" }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:600, color:st==="pending"?T.inkFaint:ag.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {st==="active"?"⟳ Running…":st==="done"?"✓ Done":"Waiting"}
                  </span>
                </div>
              </div>
            );
          })}

          <div style={{ padding:"14px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600, marginBottom:10 }}>Tools</div>
            {[["Wikipedia API",T.info],["Severus KB",T.accent],["SlaveVoyages.org",T.danger],["Imagen 4 Fast","#9B59B6"],["Veo 3.1","#9B59B6"],["PI Board Tracer",T.slate]].map(([name,color])=>(
              <div key={name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid }}>{name}</span>
              </div>
            ))}
          </div>

          {images.length > 0 && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9B59B6", fontWeight:600, marginBottom:8 }}>Generated · {images.length} image{images.length>1?"s":""}</div>
              {images.map((img,i)=>(
                <div key={i} style={{ borderRadius:7, overflow:"hidden", marginBottom:7, border:`1px solid ${T.border}` }}>
                  <img src={`data:${img.mime_type||"image/png"};base64,${img.image_b64}`} alt="" style={{ width:"100%", height:70, objectFit:"cover", display:"block" }}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Input bar ────────────────────────────────────────────── */}
      <div style={{ background:T.surface, borderTop:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", gap:10, flexShrink:0 }}>
        <input
          value={question} onChange={e=>setQuestion(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&runAgents(question)}
          placeholder="Ask the agents anything about African history…"
          disabled={running}
          style={{ flex:1, padding:"10px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.ink, outline:"none", caretColor:T.accent, opacity:running?0.6:1 }}
        />
        <button onClick={()=>runAgents(question)} disabled={running||!question.trim()}
          style={{ padding:"10px 22px", background:running||!question.trim()?T.border:T.accent, border:"none", borderRadius:8, color:running||!question.trim()?T.inkLight:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:running||!question.trim()?"not-allowed":"pointer", textTransform:"uppercase", letterSpacing:"0.04em", transition:"all 0.2s", whiteSpace:"nowrap" }}>
          {running?"⟳ Running…":"Run Agents →"}
        </button>
      </div>
    </div>
  );
}