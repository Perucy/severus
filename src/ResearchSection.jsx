import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AGENTS = {
  historian:    { label:"The Historian",    icon:"📜", color:"#009AD8" },
  investigator: { label:"The Investigator", icon:"🔍", color:"#E03030" },
  visualizer:   { label:"The Visualizer",   icon:"🎨", color:"#9B59B6" },
  guide:        { label:"The Guide",        icon:"🧭", color:"#4CAF7D" },
};

const SUGGESTIONS = [
  "What caused the fall of the Roman Empire?",
  "How did the Silk Road connect the ancient world?",
  "Who was Mansa Musa — the wealthiest person in history?",
  "What was Black Wall Street and what happened to it?",
  "How did 600 Spanish soldiers destroy the Aztec Empire?",
  "What was the Ottoman Empire and why did it collapse?",
  "Trace the Benin Bronzes from Nigeria to the British Museum",
  "How did the slave trade fund modern banking institutions?",
];

// ── Tool call block (collapsible) ─────────────────────────────
function ToolCallBlock({ event, T }) {
  const [open, setOpen] = useState(false);
  if (event.type !== "tool_call" && event.type !== "tool_result") return null;
  const isCall   = event.type === "tool_call";
  const label    = isCall ? `🔧 ${event.tool_name}` : `📥 Result`;
  const content  = isCall ? JSON.stringify(event.tool_input, null, 2) : event.content;

  return (
    <div style={{ marginBottom:4, borderRadius:6, border:`1px solid ${T.border}`, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", background:T.name==="dark"?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontFamily:"monospace", fontSize:10, color:T.inkLight }}>{label}</span>
        <span style={{ marginLeft:"auto", fontSize:10, color:T.inkFaint }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"8px 10px", background:T.name==="dark"?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.02)", borderTop:`1px solid ${T.border}` }}>
          <pre style={{ fontFamily:"monospace", fontSize:10, color:T.inkMid, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            {(content||"").slice(0, 400)}{(content||"").length > 400 ? "…" : ""}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Agent output card ─────────────────────────────────────────
function AgentCard({ agentId, output, toolCalls, showReasoning, T }) {
  const agent = AGENTS[agentId];
  if (!output) return null;

  return (
    <div style={{ marginBottom:16, border:`1px solid ${T.border}`, borderLeft:`3px solid ${agent.color}`, borderRadius:10, overflow:"hidden", background:T.card }}>
      {/* Agent header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", borderBottom:`1px solid ${T.border}`, background:agent.color+"10" }}>
        <span style={{ fontSize:18 }}>{agent.icon}</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:agent.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>{agent.label}</span>
        <div style={{ marginLeft:"auto", padding:"2px 8px", borderRadius:20, background:agent.color+"20", border:`1px solid ${agent.color}40` }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:agent.color, fontWeight:600 }}>✓ Done</span>
        </div>
      </div>

      {/* Tool calls (only when Show Reasoning is on) */}
      {showReasoning && toolCalls?.length > 0 && (
        <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}`, background:T.name==="dark"?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.02)" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.inkFaint, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:600 }}>
            Tool calls ({toolCalls.length})
          </div>
          {toolCalls.map((tc, i) => <ToolCallBlock key={i} event={tc} T={T}/>)}
        </div>
      )}

      {/* Output text */}
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.ink, lineHeight:1.85, whiteSpace:"pre-wrap" }}>
          {output}
        </div>
      </div>
    </div>
  );
}

// ── Image card ────────────────────────────────────────────────
function ImageCard({ image, index, T }) {
  const [big, setBig] = useState(false);
  if (!image?.image_b64) return null;
  const src = `data:${image.mime_type||"image/png"};base64,${image.image_b64}`;

  return (
    <>
      <div style={{ marginBottom:16, border:`1px solid ${T.border}`, borderLeft:"3px solid #9B59B6", borderRadius:10, overflow:"hidden", background:T.card }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", borderBottom:`1px solid ${T.border}`, background:"rgba(155,89,182,0.08)" }}>
          <span style={{ fontSize:18 }}>🎨</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9B59B6", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Generated Image · Scene {index + 1}
          </span>
          <span style={{ marginLeft:"auto", fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#9B59B6" }}>{image.model||"Imagen 4 Fast"}</span>
        </div>
        <img src={src} alt="" onClick={()=>setBig(true)} style={{ width:"100%", maxHeight:340, objectFit:"cover", display:"block", cursor:"zoom-in" }}/>
        {(image.prompt_used||image.prompt) && (
          <div style={{ padding:"8px 14px", borderTop:`1px solid ${T.border}` }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight, margin:0, fontStyle:"italic", lineHeight:1.5 }}>
              {(image.prompt_used||image.prompt||"").slice(0,180)}…
            </p>
          </div>
        )}
      </div>
      {big && (
        <div onClick={()=>setBig(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={src} alt="" style={{ maxWidth:"92vw", maxHeight:"92vh", objectFit:"contain", borderRadius:8 }}/>
          <div style={{ position:"absolute", top:20, right:28, color:"rgba(255,255,255,0.5)", fontSize:28, cursor:"pointer" }}>✕</div>
        </div>
      )}
    </>
  );
}

// ── Video card ────────────────────────────────────────────────
function VideoCard({ data, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:16, border:`1px solid ${T.border}`, borderLeft:"3px solid #9B59B6", borderRadius:10, overflow:"hidden", background:T.card }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer" }}>
        <span style={{ fontSize:18 }}>🎬</span>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9B59B6", textTransform:"uppercase", letterSpacing:"0.08em" }}>Video Prompt · Veo 3.1</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>Paste into Google AI Studio → Veo 3.1</div>
        </div>
        <span style={{ marginLeft:"auto", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkLight }}>{open?"▲ Hide":"▼ Show"}</span>
      </div>
      {open && (
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}` }}>
          <pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, whiteSpace:"pre-wrap", margin:0, lineHeight:1.7 }}>{data.video_prompt}</pre>
        </div>
      )}
    </div>
  );
}

// ── Guide narrative card ──────────────────────────────────────
function GuideCard({ narrative, depth, T }) {
  if (!narrative) return null;
  return (
    <div style={{ marginBottom:16, border:`1px solid ${T.border}`, borderTop:"3px solid #4CAF7D", borderRadius:10, overflow:"hidden", background:T.card }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", borderBottom:`1px solid ${T.border}`, background:"rgba(76,175,125,0.08)" }}>
        <span style={{ fontSize:18 }}>🧭</span>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#4CAF7D", textTransform:"uppercase", letterSpacing:"0.08em" }}>The Guide — {depth==="teaser"?"Story Teaser":"Deep Dive"}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight }}>Synthesized from all 4 agents</div>
        </div>
      </div>
      <div style={{ padding:"18px 20px" }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:14, color:T.ink, lineHeight:1.9, whiteSpace:"pre-wrap" }}>
          {narrative}
        </div>
      </div>
    </div>
  );
}

// ── Loading animation ─────────────────────────────────────────
function LoadingState({ stage, T }) {
  const stages = [
    { id:"historian",    label:"Historian researching…",    icon:"📜", color:"#009AD8" },
    { id:"investigator", label:"Investigator tracing connections…", icon:"🔍", color:"#E03030" },
    { id:"visualizer",   label:"Visualizer generating images…", icon:"🎨", color:"#9B59B6" },
    { id:"guide",        label:"Guide writing narrative…",  icon:"🧭", color:"#4CAF7D" },
  ];
  const idx = stages.findIndex(s => s.id === stage);
  return (
    <div style={{ padding:"32px 0", textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:0, marginBottom:28 }}>
        {stages.map((s, i) => {
          const done    = i < idx;
          const active  = i === idx;
          const pending = i > idx;
          return (
            <div key={s.id} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:pending?0.3:1, transition:"all 0.4s", transform:active?"scale(1.1)":"scale(1)" }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:done||active?s.color+"22":T.card, border:`2px solid ${done||active?s.color:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:active?`0 0 16px ${s.color}50`:"none", transition:"all 0.4s", position:"relative" }}>
                  {s.icon}
                  {done && <div style={{ position:"absolute", bottom:-2, right:-2, width:14, height:14, borderRadius:"50%", background:s.color, border:`2px solid ${T.bg}`, fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>✓</div>}
                  {active && <div style={{ position:"absolute", inset:-5, borderRadius:"50%", border:`2px solid ${s.color}50`, animation:"ping 1.4s ease-out infinite" }}/>}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:active?s.color:T.inkLight, fontWeight:active?700:400 }}>{s.label.split(" ")[1]}</span>
              </div>
              {i < stages.length-1 && (
                <div style={{ width:40, height:2, margin:"0 4px", marginBottom:18, background:i<idx?stages[i+1].color+"40":T.border, transition:"background 0.4s" }}/>
              )}
            </div>
          );
        })}
      </div>
      {stage && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkMid }}>
          {stages.find(s=>s.id===stage)?.label}
        </div>
      )}
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.6);opacity:0}}`}</style>
    </div>
  );
}

// ── Parse images from visualizer output ──────────────────────
function extractImages(vizOutput) {
  if (!vizOutput) return [];
  const scenes = vizOutput?.scenes || [];
  return scenes
    .filter(s => s.type === "generate_image" && s.result?.image_b64)
    .map(s => ({
      image_b64:   s.result.image_b64,
      mime_type:   s.result.mime_type || "image/png",
      prompt_used: s.input?.prompt || s.result.prompt_used || "",
      model:       s.result.model || "Imagen 4 Fast",
    }));
}

function extractVideos(vizOutput) {
  if (!vizOutput) return [];
  return (vizOutput?.scenes || [])
    .filter(s => s.type === "generate_video_prompt" && s.result?.video_prompt)
    .map(s => s.result);
}

function extractToolCalls(events, agentName) {
  if (!events) return [];
  return events.filter(e => e.agent === agentName && (e.type === "tool_call" || e.type === "tool_result"));
}

// ── Parse PI board directly from investigator JSON output ────
function parseConnectionsForBoard(result, question) {
  const investigatorOutput = result?.investigator_output || "";

  // Extract the ```pi_board JSON block the investigator outputs
  const match = investigatorOutput.match(/```pi_board\s*([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const rawNodes = parsed.nodes || [];
      const rawEdges = parsed.edges || [];

      // Assign positions
      const nodes = rawNodes.map((n, i) => ({
        ...n,
        x: 150 + (i % 5) * 220 + Math.random() * 30,
        y: 140 + Math.floor(i / 5) * 200 + Math.random() * 30,
      }));

      const edges = rawEdges.map((e, i) => ({
        ...e,
        id: Date.now() + i,
      }));

      return { nodes, edges };
    } catch (e) {
      console.warn("PI board JSON parse failed:", e);
    }
  }

  // Fallback: extract capitalised proper nouns from investigator output
  const nodes = [];
  const edges = [];
  const topicWords = (question||"").replace(/[^a-zA-Z\s]/g,"").split(" ").filter(w=>w.length>3);
  const topicLabel = topicWords.slice(0,4).join(" ") || "Research Topic";

  nodes.push({ id:"topic-root", label:topicLabel, type:"event",
    x:400, y:60 });

  const seen = new Set(["topic-root"]);
  const matches = [...new Set((investigatorOutput.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g)||[]))];
  let added = 0;
  for (const m of matches) {
    if (added >= 8) break;
    const skip = ["The","This","That","These","Their","There","They","Its","Our","His","Her"];
    if (m.split(" ").some(w => skip.includes(w))) continue;
    const id = m.toLowerCase().replace(/\s+/g,"-").slice(0,25);
    if (seen.has(id)) continue;
    seen.add(id);
    nodes.push({ id, label:m, type:"place",
      x: 120 + (added % 4) * 250 + Math.random()*40,
      y: 200 + Math.floor(added / 4) * 200 + Math.random()*40 });
    edges.push({ id: Date.now()+added, from:"topic-root", to:id, label:"Mentioned" });
    added++;
  }

  return { nodes, edges };
}


// ── Main component ────────────────────────────────────────────
export default function ResearchSection({ T, onPushToBoard, onNavigate, savedState, onSaveState }) {
  const [question,      setQuestion]      = useState(savedState?.question || "");
  const [depth,         setDepth]         = useState(savedState?.depth    || "teaser");
  const [showReasoning, setShowReasoning] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [stage,         setStage]         = useState("historian");
  const [result,        setResult]        = useState(savedState?.result || null);
  const [error,         setError]         = useState(null);
  const bottomRef = useRef(null);
  const stageTimer = useRef(null);

  useEffect(() => () => clearInterval(stageTimer.current), []);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [result]);

  // Animate through stages while loading
  const startStageAnimation = () => {
    const stages = ["historian","investigator","visualizer","guide"];
    // Approximate timings based on observed run times
    const delays  = [0, 15000, 30000, 45000];
    delays.forEach((d, i) => {
      setTimeout(() => { if (stageTimer.current !== null) setStage(stages[i]); }, d);
    });
  };

  const run = async (q) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStage("historian");
    stageTimer.current = 1; // mark active

    startStageAnimation();

    try {
      const res = await fetch(`${API_URL}/research`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: q, narrative_depth: depth, show_reasoning: true }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(()=>"");
        throw new Error(`Server ${res.status}: ${txt.slice(0,200)}`);
      }

      const data = await res.json();
      stageTimer.current = null;
      setResult(data);
      if (onSaveState) onSaveState({ question: q, depth, result: data });

    } catch (e) {
      stageTimer.current = null;
      setError(e.message || `Could not reach backend at ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  // Derived display data
  const images    = result ? extractImages(result.visualizer_output)   : [];
  const videos    = result ? extractVideos(result.visualizer_output)   : [];
  const allEvents = result?.events || [];

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg, overflow:"hidden" }}>

      {/* ── Controls ───────────────────────────────────────── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"9px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
        <div style={{ display:"flex", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
          {[["teaser","📋 Teaser"],["deep_dive","📖 Deep Dive"]].map(([v,l])=>(
            <button key={v} onClick={()=>setDepth(v)} style={{ padding:"6px 14px", background:depth===v?T.accent:"transparent", border:"none", color:depth===v?"#fff":T.inkMid, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:depth===v?600:400, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
          ))}
        </div>
        <div onClick={()=>setShowReasoning(v=>!v)} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px", background:showReasoning?T.info+"18":T.card, border:`1px solid ${showReasoning?T.info+"50":T.border}`, borderRadius:8, cursor:"pointer", transition:"all 0.2s" }}>
          <div style={{ width:14, height:14, borderRadius:3, background:showReasoning?T.info:"transparent", border:`1.5px solid ${showReasoning?T.info:T.inkFaint}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }}>{showReasoning&&"✓"}</div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:showReasoning?T.info:T.inkMid }}>Show reasoning</span>
        </div>
        <div style={{ flex:1 }}/>
        {result && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {Object.entries(AGENTS).map(([id,ag])=>(
              <div key={id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:ag.color, boxShadow:`0 0 4px ${ag.color}` }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:ag.color }}>{ag.label.replace("The ","")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main output ─────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

          {/* Empty state */}
          {!loading && !result && !error && (
            <div style={{ textAlign:"center", paddingTop:32 }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🌍</div>
              <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:24, fontWeight:700, color:T.ink, margin:"0 0 8px" }}>4 AI Agents. Every Civilisation.</h3>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.inkMid, maxWidth:480, margin:"0 auto 28px", lineHeight:1.75 }}>
                Ask about any civilisation in history. The Historian finds facts. The Investigator traces connections. The Visualizer generates images. The Guide writes the story.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:580, margin:"0 auto" }}>
                {SUGGESTIONS.map((s,i)=>(
                  <div key={i} onClick={()=>{setQuestion(s);run(s);}}
                    style={{ padding:"12px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, lineHeight:1.55, textAlign:"left", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"50";e.currentTarget.style.color=T.ink;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkMid;}}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingState stage={stage} T={T}/>}

          {/* Error */}
          {error && !loading && (
            <div style={{ padding:"16px 18px", background:T.danger+"15", border:`1px solid ${T.danger}40`, borderRadius:9, marginBottom:14 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:T.danger, marginBottom:5 }}>Error</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, margin:"0 0 8px" }}>{error}</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkFaint, margin:0 }}>
                Make sure the backend is running: <code style={{ background:T.surface, padding:"1px 5px", borderRadius:4 }}>python main.py</code>
              </p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              {/* Question recap */}
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                <div style={{ maxWidth:"70%", padding:"10px 14px", background:T.accent, borderRadius:"12px 12px 4px 12px" }}>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#fff", margin:0, lineHeight:1.6 }}>{result.question||question}</p>
                </div>
              </div>

              {/* Agent cards */}
              <AgentCard agentId="historian"    output={result.historian_output}    toolCalls={extractToolCalls(allEvents,"historian")}    showReasoning={showReasoning} T={T}/>
              <AgentCard agentId="investigator" output={result.investigator_output} toolCalls={extractToolCalls(allEvents,"investigator")} showReasoning={showReasoning} T={T}/>

              {/* Visualizer card + images */}
              {result.visualizer_output?.summary && (
                <AgentCard agentId="visualizer" output={result.visualizer_output.summary} toolCalls={extractToolCalls(allEvents,"visualizer")} showReasoning={showReasoning} T={T}/>
              )}
              {images.map((img,i) => <ImageCard key={i} image={img} index={i} T={T}/>)}
              {videos.map((vid,i) => <VideoCard key={i} data={vid} T={T}/>)}

              {/* Guide narrative */}
              <GuideCard narrative={result.guide_narrative} depth={depth} T={T}/>

              {/* Map to PI Board — with AI-generated preview */}
              {result.guide_narrative && onPushToBoard && (() => {
                const {nodes: piNodes, edges: piEdges} = parseConnectionsForBoard(result, question);
                if (piNodes.length === 0) return null;
                const NODE_COLORS = { person:"#009AD8", place:"#E05A2B", event:"#9B59B6", institution:"#4CAF7D", trade:"#E6A817", ship:"#E03030", document:"#708090" };
                const NODE_ICONS  = { person:"👤", place:"🏛️", event:"⚡", institution:"📖", trade:"🐪", ship:"⚓", document:"📜" };
                return (
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 18px", marginTop:4, marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.ink, marginBottom:2 }}>
                          🔍 AI-Mapped Connections — {piNodes.length} nodes, {piEdges.length} edges
                        </div>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, margin:0 }}>
                          The Investigator built this connection graph. Open it on the PI board to explore further.
                        </p>
                      </div>
                      <button
                        onClick={() => { onPushToBoard(piNodes, piEdges); onNavigate("investigate"); }}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, marginLeft:16 }}
                        onMouseEnter={e=>e.currentTarget.style.background=T.accentMid}
                        onMouseLeave={e=>e.currentTarget.style.background=T.accent}>
                        Open PI Board →
                      </button>
                    </div>
                    {/* Node preview chips */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {piNodes.map((node, i) => {
                        const color = NODE_COLORS[node.type] || T.slate;
                        const icon  = NODE_ICONS[node.type]  || "📍";
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:color+"18", border:`1px solid ${color}50`, borderRadius:20 }}>
                            <span style={{ fontSize:11 }}>{icon}</span>
                            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.ink, fontWeight:500 }}>{node.label}</span>
                            {piEdges.filter(e=>e.from===node.id||e.to===node.id).length > 0 && (
                              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:color, fontWeight:700 }}>
                                {piEdges.filter(e=>e.from===node.id||e.to===node.id).length}↔
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Edge preview */}
                    {piEdges.length > 0 && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.inkFaint, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:600 }}>Connections</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {piEdges.slice(0,8).map((edge, i) => {
                            const fromNode = piNodes.find(n=>n.id===edge.from);
                            const toNode   = piNodes.find(n=>n.id===edge.to);
                            if (!fromNode||!toNode) return null;
                            return (
                              <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkMid, padding:"2px 8px", background:T.surface, borderRadius:20, border:`1px solid ${T.border}` }}>
                                {fromNode.label} <span style={{ color:T.accent }}>→ {edge.label} →</span> {toNode.label}
                              </div>
                            );
                          })}
                          {piEdges.length > 8 && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkFaint }}>+{piEdges.length-8} more</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* ── Sidebar ────────────────────────────────────────── */}
        <div style={{ width:220, borderLeft:`1px solid ${T.border}`, background:T.surface, overflowY:"auto", flexShrink:0 }}>
          <div style={{ padding:"14px 14px 8px", fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600 }}>Agents</div>
          {Object.entries(AGENTS).map(([id,ag])=>(
            <div key={id} style={{ padding:"11px 14px", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:15 }}>{ag.icon}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:ag.color }}>{ag.label}</span>
              </div>
              <div style={{ padding:"2px 8px", borderRadius:20, background:result?ag.color+"20":T.card, border:`1px solid ${result?ag.color+"40":T.border}`, display:"inline-block" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:600, color:result?ag.color:T.inkFaint, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {result?"✓ Complete":loading&&stage===id?"⟳ Running…":"Waiting"}
                </span>
              </div>
            </div>
          ))}

          <div style={{ padding:"12px 14px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600, marginBottom:8 }}>Tools</div>
            {[["Wikipedia API",T.info],["Severus KB",T.accent],["SlaveVoyages.org",T.danger],["Imagen 4 Fast","#9B59B6"],["Veo 3.1","#9B59B6"],["PI Board Tracer",T.slate]].map(([n,c])=>(
              <div key={n} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:c, flexShrink:0 }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid }}>{n}</span>
              </div>
            ))}
          </div>

          {images.length > 0 && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9B59B6", fontWeight:600, marginBottom:8 }}>
                Generated · {images.length} image{images.length>1?"s":""}
              </div>
              {images.map((img,i)=>(
                <div key={i} style={{ borderRadius:7, overflow:"hidden", marginBottom:7, border:`1px solid ${T.border}`, cursor:"pointer" }}>
                  <img src={`data:${img.mime_type||"image/png"};base64,${img.image_b64}`} alt="" style={{ width:"100%", height:65, objectFit:"cover", display:"block" }}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Input ───────────────────────────────────────────── */}
      <div style={{ background:T.surface, borderTop:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", gap:10, flexShrink:0 }}>
        <input
          value={question} onChange={e=>setQuestion(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&run(question)}
          placeholder="Ask about any civilisation, empire, or historical event…"
          disabled={loading}
          style={{ flex:1, padding:"10px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.ink, outline:"none", caretColor:T.accent, opacity:loading?0.6:1 }}
        />
        <button onClick={()=>run(question)} disabled={loading||!question.trim()}
          style={{ padding:"10px 22px", background:loading||!question.trim()?T.border:T.accent, border:"none", borderRadius:8, color:loading||!question.trim()?T.inkLight:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:loading||!question.trim()?"not-allowed":"pointer", textTransform:"uppercase", letterSpacing:"0.04em", transition:"all 0.2s", whiteSpace:"nowrap" }}>
          {loading?"Running…":"Run Agents →"}
        </button>
      </div>
    </div>
  );
}