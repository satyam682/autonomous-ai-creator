import React, { useState, useEffect } from 'react';
import { 
  Bot, RefreshCw, Zap, Clock, ExternalLink, ShieldCheck, 
  Filter, CheckCircle, XCircle, Copy, Check, Play, Sparkles, Terminal
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Persona {
  name: string;
  domain: string;
  voice_description?: string;
}

interface Rationale {
  whyThisTopic: string;
  whyNow: string;
  selectionReason: string;
}

interface Post {
  id: string;
  createdAt: string;
  text: string;
  rationale: Rationale;
  sources: string[];
}

interface EditorialLog {
  id: string;
  timestamp: string;
  topicTitle: string;
  score: number;
  decision: string;
  rejectionReason?: string;
  sources: string[];
}

interface AgentStatus {
  agentId: string;
  persona: Persona;
  postCount: number;
  rejectedCount: number;
  lastPublishedAt?: string;
  isRunning: boolean;
}

const PRESETS: Persona[] = [
  {
    name: "Dr. Elena Vance",
    domain: "AI Security Researcher",
    voice_description: "Skeptical, empirical, razor-sharp focus on prompt injections, model security, and vulnerability research."
  },
  {
    name: "Marcus Chen",
    domain: "ML Systems Engineer",
    voice_description: "Obsessed with CUDA benchmarks, vLLM inference speed, memory bandwidth, and GPU efficiency."
  },
  {
    name: "Sophia Rodriguez",
    domain: "AI Product Analyst",
    voice_description: "Strategic, focused on unit economics, API pricing moats, developer platforms, and enterprise retention."
  },
  {
    name: "Alex Rivers",
    domain: "Developer Advocate",
    voice_description: "Hands-on, enthusiastic about open-source local LLMs, LangGraph workflows, and developer DX."
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'editorial' | 'api'>('feed');
  const [agentId, setAgentId] = useState<string>('');
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editorialLogs, setEditorialLogs] = useState<EditorialLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');
  
  // Custom Init Form
  const [customName, setCustomName] = useState<string>('Dr. Elena Vance');
  const [customDomain, setCustomDomain] = useState<string>('AI Security Researcher');
  const [showInitModal, setShowInitModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');

  // Expanded rationale tracking
  const [expandedRationale, setExpandedRationale] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFeedAndStatus();
    const interval = setInterval(fetchFeedAndStatus, 10000);
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchFeedAndStatus = async () => {
    try {
      const feedUrl = agentId 
        ? `${API_BASE}/api/agent/feed?agentId=${agentId}`
        : `${API_BASE}/api/agent/feed`;
      
      const feedRes = await fetch(feedUrl);
      if (feedRes.ok) {
        const feedData = await fetch(feedRes.json() as any);
        setPosts(feedData.posts || []);
      }

      const statusUrl = agentId 
        ? `${API_BASE}/api/agent/status?agentId=${agentId}`
        : `${API_BASE}/api/agent/status`;
      
      const statusRes = await fetch(statusUrl);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
        if (!agentId && statusData.agentId) {
          setAgentId(statusData.agentId);
        }
      }

      // Fetch Editorial Logs
      const logsUrl = agentId 
        ? `${API_BASE}/api/agent/editorial-logs?agentId=${agentId}`
        : `${API_BASE}/api/agent/editorial-logs`;
      const logsRes = await fetch(logsUrl);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEditorialLogs(logsData.logs || []);
      }
    } catch (e) {
      console.warn("Backend not reached yet or initializing...", e);
    }
  };

  const handleInitAgent = async (persona: Persona) => {
    setLoading(true);
    setActionMessage('Initializing autonomous agent...');
    try {
      const res = await fetch(`${API_BASE}/api/agent/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona })
      });
      if (res.ok) {
        const data = await res.json();
        setAgentId(data.agentId);
        setShowInitModal(false);
        setActionMessage(`Agent initialized! ID: ${data.agentId}`);
        await fetchFeedAndStatus();
      }
    } catch (e) {
      setActionMessage('Failed to connect to backend server.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleTriggerCycle = async () => {
    setLoading(true);
    setActionMessage('Running autonomous discovery, evaluation & post generation...');
    try {
      const res = await fetch(`${API_BASE}/api/agent/trigger-cycle?agentId=${agentId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          setActionMessage('New post published autonomously!');
        } else {
          setActionMessage(data.message || 'Topic evaluation completed.');
        }
        await fetchFeedAndStatus();
      }
    } catch (e) {
      setActionMessage('Error triggering cycle.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleSimulate48h = async () => {
    setLoading(true);
    setActionMessage('Simulating 48-hour autonomous publishing timeline...');
    try {
      const res = await fetch(`${API_BASE}/api/agent/simulate-48h?agentId=${agentId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(`Simulated 48h! Generated ${data.postsGenerated} historical posts across timeline.`);
        await fetchFeedAndStatus();
      }
    } catch (e) {
      setActionMessage('Error simulating timeline.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const toggleRationale = (id: string) => {
    setExpandedRationale(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Top Header Navigation */}
      <header className="neo-box-lg" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="neo-badge badge-yellow" style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>
                <Bot size={20} /> AUTONOMOUS AI CREATOR
              </div>
              <span className="neo-badge badge-green">LIVE 🟢</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem', color: '#333' }}>
              Zero human prompting after init • 48h Scheduled Cadence • Transparent Rationale & Audit Vault
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="neo-btn neo-btn-primary" onClick={() => setShowInitModal(true)}>
              <Sparkles size={16} /> Init Agent
            </button>
            <button className="neo-btn neo-btn-cyan" onClick={handleTriggerCycle} disabled={loading}>
              <Play size={16} /> Run Cycle Now
            </button>
            <button className="neo-btn neo-btn-pink" onClick={handleSimulate48h} disabled={loading}>
              <Clock size={16} /> Simulate 48h Timeline
            </button>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="neo-box badge-yellow" style={{ marginTop: '1rem', padding: '0.6rem 1rem', fontWeight: 800 }}>
            ⚡ {actionMessage}
          </div>
        )}
      </header>

      {/* Preset Persona Quick Select Bar */}
      <div className="neo-box" style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
          🎯 Select / Switch Active Persona Archetype:
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => {
            const isActive = status?.persona?.domain === p.domain;
            return (
              <button
                key={p.domain}
                className={`neo-btn ${isActive ? 'neo-btn-primary' : ''}`}
                style={{ backgroundColor: isActive ? 'var(--yellow)' : '#fff', fontSize: '0.85rem' }}
                onClick={() => handleInitAgent(p)}
              >
                {p.name} <span style={{ opacity: 0.7, fontWeight: 500 }}>({p.domain})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Bar Grid */}
      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="neo-box" style={{ padding: '1rem', backgroundColor: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>ACTIVE AGENT ID</div>
            <div className="mono-text" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.2rem' }}>{status.agentId}</div>
          </div>
          <div className="neo-box" style={{ padding: '1rem', backgroundColor: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>PERSONA NAME & DOMAIN</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.2rem' }}>{status.persona.name}</div>
            <div className="neo-badge badge-cyan" style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>{status.persona.domain}</div>
          </div>
          <div className="neo-box" style={{ padding: '1rem', backgroundColor: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>FEED POSTS PUBLISHED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.1rem' }}>{status.postCount} Posts</div>
          </div>
          <div className="neo-box" style={{ padding: '1rem', backgroundColor: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>TOPICS REJECTED (EDITORIAL FILTER)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.1rem', color: 'var(--pink)' }}>{status.rejectedCount} Rejected</div>
          </div>
        </div>
      )}

      {/* Main Tabs Header */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`neo-btn ${activeTab === 'feed' ? 'neo-btn-primary' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <Bot size={16} /> Autonomous Feed ({posts.length})
        </button>
        <button
          className={`neo-btn ${activeTab === 'editorial' ? 'neo-btn-pink' : ''}`}
          onClick={() => setActiveTab('editorial')}
        >
          <Filter size={16} /> Editorial Decision Vault ({editorialLogs.length})
        </button>
        <button
          className={`neo-btn ${activeTab === 'api' ? 'neo-btn-cyan' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <Terminal size={16} /> Evaluator API Specs
        </button>
      </div>

      {/* TAB 1: AUTONOMOUS FEED */}
      {activeTab === 'feed' && (
        <div>
          {posts.length === 0 ? (
            <div className="neo-box" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff' }}>
              <Bot size={48} style={{ marginBottom: '1rem' }} />
              <h3>No posts published yet.</h3>
              <p style={{ marginTop: '0.5rem' }}>Click "Init Agent" or "Run Cycle Now" to start autonomous post generation.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {posts.map((post) => {
                const isExpanded = expandedRationale[post.id];
                return (
                  <article key={post.id} className="neo-box-lg" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
                    
                    {/* Post Meta Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="neo-badge badge-yellow">{status?.persona?.name || "AI Agent"}</span>
                        <span className="neo-badge badge-white mono-text" style={{ fontSize: '0.75rem' }}>
                          <Clock size={12} style={{ marginRight: '4px' }} /> {post.createdAt}
                        </span>
                      </div>
                      <button 
                        className="neo-btn" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#fff' }}
                        onClick={() => copyToClipboard(post.text, post.id)}
                      >
                        {copiedId === post.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === post.id ? 'Copied' : 'Copy Post'}
                      </button>
                    </div>

                    {/* Post Content Text */}
                    <div style={{ fontSize: '1.05rem', fontWeight: 500, whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '1.2rem' }}>
                      {post.text}
                    </div>

                    {/* Sources Badge */}
                    {post.sources && post.sources.length > 0 && (
                      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>SOURCES:</span>
                        {post.sources.map((src, idx) => (
                          <a 
                            key={idx} 
                            href={src} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="neo-badge badge-cyan"
                            style={{ textDecoration: 'none', color: '#000' }}
                          >
                            Source #{idx + 1} <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Transparent Rationale Accordion */}
                    <div className="neo-box" style={{ backgroundColor: '#fff9e6', padding: '1rem', marginTop: '0.8rem' }}>
                      <div 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800 }}
                        onClick={() => toggleRationale(post.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ShieldCheck size={18} color="#000" /> TRANSPARENT RATIONALE & PROVENANCE
                        </span>
                        <span className="neo-badge badge-yellow">{isExpanded ? 'Hide ▲' : 'Inspect ▼'}</span>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '2px solid #000', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#333' }}>Why This Topic: </span>
                            <span>{post.rationale.whyThisTopic}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#333' }}>Why Now: </span>
                            <span>{post.rationale.whyNow}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#333' }}>Editorial Decision Reason: </span>
                            <span>{post.rationale.selectionReason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDITORIAL DECISION VAULT */}
      {activeTab === 'editorial' && (
        <div>
          <div className="neo-box" style={{ padding: '1.2rem', marginBottom: '1rem', backgroundColor: '#fff' }}>
            <h3 style={{ marginBottom: '0.3rem' }}>🛡️ Editorial Curation Audit Vault</h3>
            <p style={{ fontSize: '0.9rem', color: '#444' }}>
              The agent actively evaluates candidate topics from live sources and <b>rejects</b> off-topic, repetitive, or low-quality items to ensure high signal-to-noise ratio.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {editorialLogs.length === 0 ? (
              <div className="neo-box" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff' }}>
                No evaluation logs recorded yet. Run a publishing cycle to populate evaluation history.
              </div>
            ) : (
              editorialLogs.map((log) => {
                const isAccepted = log.decision === 'ACCEPTED';
                return (
                  <div key={log.id} className="neo-box" style={{ padding: '1rem', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAccepted ? (
                          <span className="neo-badge badge-green"><CheckCircle size={14} /> ACCEPTED</span>
                        ) : (
                          <span className="neo-badge badge-pink"><XCircle size={14} /> REJECTED</span>
                        )}
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{log.topicTitle}</span>
                      </div>
                      <span className="neo-badge badge-yellow">Score: {log.score}/10</span>
                    </div>

                    {log.rejectionReason && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c00', marginTop: '0.4rem' }}>
                        Reason: {log.rejectionReason}
                      </div>
                    )}
                    
                    <div className="mono-text" style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.4rem' }}>
                      Evaluated at: {log.timestamp}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: API SPECS & EVALUATOR HELP */}
      {activeTab === 'api' && (
        <div className="neo-box-lg" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔌 Hackathon Evaluator API Endpoints</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.4rem' }}>1. Initialize Agent Persona (Called once)</div>
            <pre className="neo-box mono-text" style={{ padding: '1rem', backgroundColor: '#1e1e1e', color: '#00ff66', fontSize: '0.85rem', overflowX: 'auto' }}>
{`POST /api/agent/init
Header: Content-Type: application/json

Body:
{
  "persona": {
    "name": "Dr. Elena Vance",
    "domain": "AI Security Researcher"
  }
}

Response (200 OK):
{
  "agentId": "${agentId || 'agent_sample123'}",
  "persona": { "name": "Dr. Elena Vance", "domain": "AI Security Researcher" },
  "createdAt": "${new Date().toISOString()}",
  "status": "ACTIVE"
}`}
            </pre>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: '0.4rem' }}>2. Fetch Autonomous Feed (Called repeatedly)</div>
            <pre className="neo-box mono-text" style={{ padding: '1rem', backgroundColor: '#1e1e1e', color: '#00ff66', fontSize: '0.85rem', overflowX: 'auto' }}>
{`GET /api/agent/feed?agentId=${agentId || 'agent_sample123'}

Response (200 OK):
{
  "posts": [
    {
      "id": "post_a1b2c3d4",
      "createdAt": "2026-08-08T09:30:00Z",
      "text": "When evaluating recent shifts in AI Security Researcher...",
      "rationale": {
        "whyThisTopic": "Critical technical shift in AI Security & Vulnerabilities.",
        "whyNow": "Surfaced via Hacker News top feed with recent community focus.",
        "selectionReason": "ACCEPTED: High relevance score (8.5/10)."
      },
      "sources": ["https://news.ycombinator.com/item?id=389123"]
    }
  ]
}`}
            </pre>
          </div>
        </div>
      )}

      {/* CUSTOM INIT MODAL */}
      {showInitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="neo-box-lg" style={{ padding: '2rem', backgroundColor: '#fff', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '1rem' }}>⚙️ Initialize Persona</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Agent Persona Name:</label>
              <input 
                type="text" 
                value={customName} 
                onChange={(e) => setCustomName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '3px solid #000', borderRadius: '4px', fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Domain Expertise:</label>
              <input 
                type="text" 
                value={customDomain} 
                onChange={(e) => setCustomDomain(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '3px solid #000', borderRadius: '4px', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button className="neo-btn" onClick={() => setShowInitModal(false)}>Cancel</button>
              <button 
                className="neo-btn neo-btn-primary" 
                onClick={() => handleInitAgent({ name: customName, domain: customDomain })}
              >
                Initialize Agent
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
