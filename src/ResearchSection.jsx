/**
 * Severus Research Section
 * Multi-agent UI with LangGraph backend via SSE streaming.
 * Drop this into src/ResearchSection.jsx
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── AGENT CONFIG ──────────────────────────────────────────────
const AGENTS = {
  historian:    { label:"The Historian",    icon:"📜", color:"#009AD8", desc:"Searches Wikipedia & Severus KB for verified historical facts" },
  investigator: { label:"The Investigator", icon:"🔍", color:"#E03030", desc:"Traces connections — follows money, lineage, and accountability chains" },
  visualizer:   { label:"The Visualizer",   icon:"🎨", color:"#9B59B6", desc:"Generates images via Nano Banana Pro & creates video prompts" },
  guide:        { label:"The Guide",        icon:"🧭", color:"#4CAF7D", desc:"Synthesizes everything into a narrative journey" },
};

const SUGGESTIONS = [
  "Tell me about the Egyptian pyramids and their African origins",
  "Who financed the transatlantic slave trade and where is that wealth today?",
  "What was the Kingdom of Mali and why isn't it taught in schools?",
  "Trace the journey of the Benin Bronzes from Nigeria to British museums",
  "How did Haitian Revolution succeed against Napoleon's army?",
  "What did Timbuktu look like at its peak under Mansa Musa?",
];

// ── AGENT NODE (graph visualisation) ─────────────────────────
function AgentNode({ agentId, status, T }) {
  const agent = AGENTS[agentId];
  const isActive  = status === "active";
  const isDone    = status === "done";
  const isPending = status === "pending";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: isPending ? 0.35 : 1,
      transition: "opacity 0.4s, transform 0.3s",
      transform: isActive ? "scale(1.05)" : "scale(1)",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: isDone ? agent.color + "22" : isActive ? agent.color + "30" : T.card,
        border: `2px solid ${isDone ? agent.color : isActive ? agent.color : T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        boxShadow: isActive ? `0 0 20px ${agent.color}60` : "none",
        transition: "all 0.4s",
        position: "relative",
      }}>
        {agent.icon}
        {isDone && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 16, height: 16, borderRadius: "50%",
            background: agent.color, border: `2px solid ${T.bg}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9,
          }}>✓</div>
        )}
        {isActive && (
          <div style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            border: `2px solid ${agent.color}`,
            animation: "pulse-ring 1.5s ease-out infinite",
          }}/>
        )}
      </div>
      <div style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600,
        color: isDone || isActive ? agent.color : T.inkLight,
        textAlign: "center", whiteSpace: "nowrap",
        letterSpacing: "0.04em",
      }}>{agent.label}</div>
    </div>
  );
}

// ── TOOL CALL CARD ────────────────────────────────────────────
function ToolCallCard({ event, T, showReasoning }) {
  const [expanded, setExpanded] = useState(false);
  const agent = AGENTS[event.agent];
  if (!agent) return null;

  const isThinking = event.type === "thinking";
  const isToolCall = event.type === "tool_call";
  const isToolResult = event.type === "tool_result";
  const isOutput = event.type === "output";

  if (isThinking && !showReasoning) return null;

  const borderColor = agent.color;
  const bgColor = agent.color + (T.name === "dark" ? "12" : "08");

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}25`,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8, padding: "10px 12px",
      marginBottom: 8,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: isToolResult ? "pointer" : "default" }}
        onClick={() => isToolResult && setExpanded(e => !e)}>
        <span style={{ fontSize: 14 }}>{agent.icon}</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: agent.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {agent.label}
        </span>
        <div style={{
          padding: "1px 7px", borderRadius: 20, fontSize: 9,
          background: agent.color + "20", color: agent.color,
          fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {isThinking ? "thinking" : isToolCall ? `tool: ${event.tool_name}` : isToolResult ? "result" : "output"}
        </div>
        {isToolResult && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: T.inkLight }}>{expanded ? "▲" : "▼"}</span>
        )}
      </div>

      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid,
        lineHeight: 1.65, margin: "6px 0 0",
        whiteSpace: isToolResult && !expanded ? "nowrap" : "pre-wrap",
        overflow: "hidden", textOverflow: isToolResult && !expanded ? "ellipsis" : "visible",
        maxHeight: isToolResult && !expanded ? "1.65em" : "none",
      }}>
        {event.content}
      </p>

      {isToolCall && event.tool_input && (
        <div style={{
          marginTop: 6, padding: "6px 8px",
          background: T.name === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
          borderRadius: 5, fontFamily: "monospace", fontSize: 10, color: T.inkLight,
        }}>
          {JSON.stringify(event.tool_input, null, 2)}
        </div>
      )}
    </div>
  );
}

// ── IMAGE CARD ────────────────────────────────────────────────
function ImageCard({ image, T }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 12,
    }}>
      {image.image_b64 ? (
        <img
          src={`data:${image.mime_type || "image/png"};base64,${image.image_b64}`}
          alt="Generated historical scene"
          style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ padding: "16px", background: "rgba(155,89,182,0.08)", borderLeft: "3px solid #9B59B6" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "#9B59B6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            🎨 Nano Banana Pro Prompt Ready
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>
            {image.prompt || image.prompt_ready || "Image prompt generated"}
          </p>
        </div>
      )}
      {image.prompt && (
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.inkLight, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
            {(image.prompt || "").slice(0, 140)}…
          </p>
        </div>
      )}
    </div>
  );
}

// ── VIDEO PROMPT CARD ─────────────────────────────────────────
function VideoPromptCard({ data, T }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: "3px solid #9B59B6", borderRadius: 8,
      padding: "12px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#9B59B6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          🎬 Video Prompt — {data.recommended_tool || "Video Generator"}
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: T.inkLight }}>
          {expanded ? "▲ Collapse" : "▼ Expand"}
        </button>
      </div>
      {expanded && (
        <pre style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkMid, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}>
          {data.video_prompt}
        </pre>
      )}
    </div>
  );
}

// ── NARRATIVE OUTPUT ──────────────────────────────────────────
function NarrativeOutput({ narrative, depth, T }) {
  if (!narrative) return null;
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderTop: `3px solid #4CAF7D`,
      borderRadius: 10, padding: "20px 22px",
      marginTop: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>🧭</span>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#4CAF7D", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            The Guide — {depth === "teaser" ? "Story Teaser" : "Deep Dive"}
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.inkLight }}>
            Synthesized narrative from all 4 agents
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: "'Playfair Display',Georgia,serif",
        fontSize: 14, color: T.ink, lineHeight: 1.85,
        whiteSpace: "pre-wrap",
      }}>
        {narrative}
      </div>
    </div>
  );
}

// ── MAIN RESEARCH SECTION ─────────────────────────────────────
export default function ResearchSection({ T }) {
  const [question,      setQuestion]      = useState("");
  const [depth,         setDepth]         = useState("teaser");
  const [showReasoning, setShowReasoning] = useState(false);
  const [running,       setRunning]       = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({
    historian: "pending", investigator: "pending",
    visualizer: "pending", guide: "pending",
  });
  const [events,     setEvents]     = useState([]);
  const [images,     setImages]     = useState([]);
  const [videos,     setVideos]     = useState([]);
  const [narrative,  setNarrative]  = useState(null);
  const [error,      setError]      = useState(null);
  const [hasRun,     setHasRun]     = useState(false);

  const eventsEndRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const resetState = () => {
    setEvents([]);
    setImages([]);
    setVideos([]);
    setNarrative(null);
    setError(null);
    setAgentStatuses({ historian:"pending", investigator:"pending", visualizer:"pending", guide:"pending" });
  };

  const runAgents = useCallback(async (q) => {
    if (!q.trim() || running) return;
    resetState();
    setRunning(true);
    setHasRun(true);

    if (esRef.current) { esRef.current.close(); }

    try {
      // Use fetch with ReadableStream for SSE POST
      const response = await fetch(`${API_URL}/research/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, narrative_depth: depth, show_reasoning: showReasoning }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types
              if (data.agent) {
                // It's an agent_event
                setEvents(prev => [...prev, data]);

                // Update agent status
                if (data.type === "thinking") {
                  setAgentStatuses(prev => ({ ...prev, [data.agent]: "active" }));
                } else if (data.type === "output") {
                  setAgentStatuses(prev => ({ ...prev, [data.agent]: "done" }));
                }
              } else if (data.image_b64 || data.prompt_ready) {
                setImages(prev => [...prev, data]);
              } else if (data.video_prompt) {
                setVideos(prev => [...prev, data]);
              } else if (data.narrative) {
                setNarrative(data.narrative);
                setAgentStatuses(prev => ({ ...prev, guide: "done" }));
              } else if (data.error) {
                setError(data.error);
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      setError(e.message || "Connection failed — is the backend running?");
    } finally {
      setRunning(false);
    }
  }, [depth, showReasoning, running]);

  const agentOrder = ["historian", "investigator", "visualizer", "guide"];
  const activeAgent = agentOrder.find(a => agentStatuses[a] === "active");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top controls */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        {/* Depth toggle */}
        <div style={{ display: "flex", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          {[["teaser","📋 Teaser"],["deep_dive","📖 Deep Dive"]].map(([v,l]) => (
            <button key={v} onClick={() => setDepth(v)} style={{ padding: "6px 14px", background: depth===v?T.accent:"transparent", border:"none", color: depth===v?"#fff":T.inkMid, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:depth===v?600:400, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
          ))}
        </div>

        {/* Reasoning toggle */}
        <div onClick={() => setShowReasoning(v => !v)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", background: showReasoning?T.info+"18":T.card, border: `1px solid ${showReasoning?T.info+"50":T.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: showReasoning?T.info:"transparent", border: `1.5px solid ${showReasoning?T.info:T.inkFaint}`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",transition:"all 0.2s" }}>
            {showReasoning && "✓"}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:showReasoning?T.info:T.inkMid }}>Show reasoning</span>
        </div>

        <div style={{ flex:1 }} />

        {/* Agent status indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {agentOrder.map(id => {
            const st = agentStatuses[id];
            const ag = AGENTS[id];
            return (
              <div key={id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: st==="done"?ag.color:st==="active"?ag.color:"transparent", border:`1.5px solid ${st==="pending"?T.inkFaint:ag.color}`, transition:"all 0.3s", boxShadow:st==="active"?`0 0 6px ${ag.color}`:"none" }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:st==="pending"?T.inkFaint:ag.color }}>{ag.label.replace("The ","")}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left — agent graph + events */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Agent graph */}
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
              {agentOrder.map((id, i) => (
                <div key={id} style={{ display: "flex", alignItems: "center" }}>
                  <AgentNode agentId={id} status={agentStatuses[id]} T={T} />
                  {i < agentOrder.length - 1 && (
                    <div style={{ width: 40, height: 2, margin: "0 8px", marginBottom: 20, background: agentStatuses[agentOrder[i+1]] !== "pending" ? AGENTS[agentOrder[i+1]].color + "40" : T.border, transition: "background 0.4s" }}/>
                  )}
                </div>
              ))}
            </div>
            {activeAgent && (
              <div style={{ textAlign: "center", marginTop: 6, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:AGENTS[activeAgent].color }}>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 6 }}>⟳</span>
                {AGENTS[activeAgent].label} is working…
              </div>
            )}
          </div>

          {/* Events stream */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {!hasRun && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
                <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:T.ink, margin:"0 0 8px" }}>4 AI Agents. 300,000 Years of History.</h3>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.inkMid, maxWidth:480, margin:"0 auto 28px", lineHeight:1.7 }}>
                  Ask anything. The Historian finds facts. The Investigator traces connections. The Visualizer generates images. The Guide weaves it all into a story.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:560, margin:"0 auto" }}>
                  {SUGGESTIONS.map((s,i) => (
                    <div key={i} onClick={() => { setQuestion(s); runAgents(s); }}
                      style={{ padding:"12px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, lineHeight:1.5, textAlign:"left", transition:"all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=T.accent+"50"; e.currentTarget.style.color=T.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.inkMid; }}
                    >{s}</div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding:"14px 16px", background:T.danger+"15", border:`1px solid ${T.danger}40`, borderRadius:8, marginBottom:12 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:T.danger, marginBottom:4 }}>Error</div>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, margin:0 }}>{error}</p>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkLight, margin:"6px 0 0" }}>Make sure the backend is running: <code>python main.py</code> in severus-backend/</p>
              </div>
            )}

            {events.map((ev, i) => (
              <ToolCallCard key={i} event={ev} T={T} showReasoning={showReasoning} />
            ))}

            {/* Generated images */}
            {images.map((img, i) => <ImageCard key={i} image={img} T={T} />)}

            {/* Video prompts */}
            {videos.map((vid, i) => <VideoPromptCard key={i} data={vid} T={T} />)}

            {/* Final narrative */}
            <NarrativeOutput narrative={narrative} depth={depth} T={T} />

            <div ref={eventsEndRef} />
          </div>
        </div>

        {/* Right — agent details sidebar */}
        <div style={{ width: 240, borderLeft: `1px solid ${T.border}`, background: T.surface, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "14px 14px 8px", fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600 }}>Agents</div>
          {agentOrder.map(id => {
            const ag = AGENTS[id];
            const st = agentStatuses[id];
            return (
              <div key={id} style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, opacity:st==="pending"?0.45:1, transition:"opacity 0.3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{ag.icon}</span>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:st!=="pending"?ag.color:T.inkMid }}>{ag.label}</div>
                </div>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkLight, lineHeight:1.55, margin:"0 0 6px" }}>{ag.desc}</p>
                <div style={{ padding:"2px 8px", borderRadius:20, background:st==="done"?ag.color+"20":st==="active"?ag.color+"30":T.card, border:`1px solid ${st==="pending"?T.border:ag.color+"50"}`, display:"inline-block" }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:600, color:st==="pending"?T.inkFaint:ag.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {st === "active" ? "⟳ Running…" : st === "done" ? "✓ Complete" : "Waiting"}
                  </span>
                </div>
              </div>
            );
          })}

          <div style={{ padding: "14px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.inkFaint, fontWeight:600, marginBottom:10 }}>Tools</div>
            {[
              { name:"Wikipedia API", color:T.info },
              { name:"Severus KB", color:T.accent },
              { name:"SlaveVoyages.org", color:T.danger },
              { name:"Nano Banana Pro", color:"#9B59B6" },
              { name:"PI Board Tracer", color:T.slate },
            ].map(tool => (
              <div key={tool.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:tool.color, flexShrink:0 }}/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid }}>{tool.name}</span>
              </div>
            ))}
          </div>

          <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.border}`, background:T.name==="dark"?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.02)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.inkFaint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Backend</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkLight, lineHeight:1.5 }}>
              FastAPI + LangGraph<br/>
              Runs at localhost:8000<br/>
              <span style={{ color:T.accent }}>Start: python main.py</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ background:T.surface, borderTop:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", gap:10, flexShrink:0 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && runAgents(question)}
          placeholder="Ask the agents anything about African history…"
          disabled={running}
          style={{ flex:1, padding:"10px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.ink, outline:"none", caretColor:T.accent, opacity:running?0.6:1 }}
        />
        <button
          onClick={() => runAgents(question)}
          disabled={running || !question.trim()}
          style={{ padding:"10px 20px", background:running||!question.trim()?T.border:T.accent, border:"none", borderRadius:8, color:running||!question.trim()?T.inkLight:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:running||!question.trim()?"not-allowed":"pointer", textTransform:"uppercase", letterSpacing:"0.04em", transition:"all 0.2s", whiteSpace:"nowrap" }}
        >
          {running ? "⟳ Running…" : "Run Agents →"}
        </button>
      </div>
    </div>
  );
}