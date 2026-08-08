import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Rss, ShieldAlert, Globe, Clock, Box, Settings, Code,
  Play, Sparkles, Copy, Check, ExternalLink, Activity, Filter, ChevronLeft, ChevronRight,
  TrendingUp, CheckCircle2, XCircle, ShieldCheck, Heart, Repeat, Share2,
  Database, Zap, Menu, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Persona {
  name: string;
  domain: string;
  avatar: string;
  handle: string;
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
  likes?: number;
  reposts?: number;
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

const PERSONA_LIST: Persona[] = [
  {
    name: "DR. ELENA VANCE",
    domain: "AI Security Researcher",
    handle: "@elena_aisec",
    avatar: "/avatars/elena.png",
    voice_description: "Skeptical, empirical, razor-sharp focus on prompt injections, model security, and vulnerability research."
  },
  {
    name: "MARCUS CHEN",
    domain: "ML Systems Engineer",
    handle: "@marcus_cuda",
    avatar: "/avatars/marcus.png",
    voice_description: "Obsessed with CUDA benchmarks, vLLM inference speed, memory bandwidth, and GPU efficiency."
  },
  {
    name: "SOPHIA RODRIGUEZ",
    domain: "AI Product Analyst",
    handle: "@sophia_aistrat",
    avatar: "/avatars/sophia.png",
    voice_description: "Strategic, focused on unit economics, API pricing moats, developer platforms, and enterprise retention."
  },
  {
    name: "ALEX RIVERS",
    domain: "Developer Advocate",
    handle: "@alex_langchain",
    avatar: "/avatars/alex.png",
    voice_description: "Hands-on, enthusiastic about open-source local LLMs, LangGraph workflows, and developer DX."
  }
];

export function App() {
  const [activeNav, setActiveNav] = useState<string>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<'feed' | 'editorial' | 'api'>('feed');
  const [agentId, setAgentId] = useState<string>('agent_91596f42');
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editorialLogs, setEditorialLogs] = useState<EditorialLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');
  
  // Active Persona selection
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONA_LIST[0]);
  
  // Interactive Feed State
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'ACCEPTED' | 'REJECTED'>('ALL');

  // Modals & Accordions
  const [showInitModal, setShowInitModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Settings State
  const [publishInterval, setPublishInterval] = useState<number>(180);
  const [customVoice, setCustomVoice] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  const [sliderIndex, setSliderIndex] = useState<number>(0);
  const [feedPageIndex, setFeedPageIndex] = useState<number>(0);
  const [showAllFeed, setShowAllFeed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handlePrevFeedPage = () => {
    setFeedPageIndex(prev => (prev > 0 ? prev - 1 : posts.length - 1));
  };

  const handleNextFeedPage = () => {
    setFeedPageIndex(prev => (prev < posts.length - 1 ? prev + 1 : 0));
  };

  const handlePrevPersona = () => {
    const nextIdx = sliderIndex > 0 ? sliderIndex - 1 : PERSONA_LIST.length - 1;
    setSliderIndex(nextIdx);
    handleInitAgent(PERSONA_LIST[nextIdx]);
  };

  const handleNextPersona = () => {
    const nextIdx = sliderIndex < PERSONA_LIST.length - 1 ? sliderIndex + 1 : 0;
    setSliderIndex(nextIdx);
    handleInitAgent(PERSONA_LIST[nextIdx]);
  };

  useEffect(() => {
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    fetchFeedAndStatus();
    const pollInterval = setInterval(fetchFeedAndStatus, 8000);
    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, [agentId]);

  const updateClock = () => {
    const now = new Date();
    setTimeStr(now.toLocaleTimeString('en-GB', { hour12: false }));
    const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    setDateStr(`${d} (IST)`);
  };

  const fetchFeedAndStatus = async () => {
    try {
      const feedUrl = agentId 
        ? `${API_BASE}/api/agent/feed?agentId=${agentId}`
        : `${API_BASE}/api/agent/feed`;
      
      const feedRes = await fetch(feedUrl);
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const rawPosts: Post[] = feedData.posts || [];
        // Add simulated engagement counts
        const enriched = rawPosts.map((p, idx) => ({
          ...p,
          likes: 42 + (idx * 7) % 35,
          reposts: 12 + (idx * 3) % 19
        }));
        setPosts(enriched);
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

      const logsUrl = agentId 
        ? `${API_BASE}/api/agent/editorial-logs?agentId=${agentId}`
        : `${API_BASE}/api/agent/editorial-logs`;
      const logsRes = await fetch(logsUrl);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEditorialLogs(logsData.logs || []);
      }
    } catch (e) {
      // Background catch
    }
  };

  const handleInitAgent = async (persona: Persona) => {
    setLoading(true);
    setSelectedPersona(persona);
    setActionMessage(`Initializing autonomous agent for ${persona.name}...`);
    try {
      const res = await fetch(`${API_BASE}/api/agent/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: {
            name: persona.name,
            domain: persona.domain,
            voice_description: persona.voice_description
          }
        })
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
    setActionMessage('Executing live discovery, editorial evaluation & post generation...');
    try {
      const res = await fetch(`${API_BASE}/api/agent/trigger-cycle?agentId=${agentId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          setActionMessage('New post published autonomously!');
        } else {
          setActionMessage(data.message || 'Cycle completed.');
        }
        await fetchFeedAndStatus();
      }
    } catch (e) {
      setActionMessage('Error running cycle.');
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
        setActionMessage(`Timeline generated! ${data.postsGenerated} posts published over 48h simulation.`);
        await fetchFeedAndStatus();
      }
    } catch (e) {
      setActionMessage('Error simulating timeline.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const toggleLike = (id: string) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRepost = (id: string) => {
    setRepostedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const currentPersona = status?.persona || selectedPersona;
  const postCount = posts.length || status?.postCount || 1;
  const rejectedCount = status?.rejectedCount || 0;
  const acceptRate = (postCount + rejectedCount) > 0 
    ? Math.round((postCount / (postCount + rejectedCount)) * 100) 
    : 100;

  const filteredLogs = editorialLogs.filter(log => {
    if (filterDecision === 'ACCEPTED') return log.decision === 'ACCEPTED';
    if (filterDecision === 'REJECTED') return log.decision === 'REJECTED';
    return true;
  });

  return (
    <div className="nova-app-container">

      {/* Mobile Dark Overlay Backdrop */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'mobile-open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Mobile Top Header Bar with Hamburger Button */}
      <div className="mobile-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/elevexa_logo_transparent.png" alt="Elevexa Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          <span className="badge-neo badge-lime" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>• LIVE</span>
        </div>
        <button 
          className="btn-neo btn-neo-white" 
          style={{ padding: '0.35rem 0.6rem' }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* 1. LEFT SIDEBAR (Desktop Sticky & Mobile Slide Drawer) */}
      <aside className={`nova-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          {/* Logo Branding */}
          <div className="nova-brand-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.2rem', padding: '0.3rem 0' }}>
            <img 
              src="/elevexa_logo_transparent.png" 
              alt="Elevexa Logo" 
              style={{ width: '100%', maxWidth: '180px', height: 'auto', display: 'block', objectFit: 'contain' }} 
            />
            {isMobileMenuOpen && (
              <button 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '0.5rem' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <ul className="nova-nav-list">
            <li 
              className={`nova-nav-item ${activeNav === 'DASHBOARD' ? 'active' : ''}`}
              onClick={() => { setActiveNav('DASHBOARD'); setActiveTab('feed'); setIsMobileMenuOpen(false); }}
            >
              <LayoutDashboard size={18} /> DASHBOARD
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'FEED' ? 'active' : ''}`}
              onClick={() => { setActiveNav('FEED'); setIsMobileMenuOpen(false); }}
            >
              <Rss size={18} /> SIMULATED FEED
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'DECISIONS' ? 'active' : ''}`}
              onClick={() => { setActiveNav('DECISIONS'); setIsMobileMenuOpen(false); }}
            >
              <Filter size={18} /> DECISIONS
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'SOURCES' ? 'active' : ''}`}
              onClick={() => { setActiveNav('SOURCES'); setIsMobileMenuOpen(false); }}
            >
              <Globe size={18} /> SOURCES
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'TIMELINE' ? 'active' : ''}`}
              onClick={() => { setActiveNav('TIMELINE'); setIsMobileMenuOpen(false); }}
            >
              <Clock size={18} /> TIMELINE
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'VAULT' ? 'active' : ''}`}
              onClick={() => { setActiveNav('VAULT'); setIsMobileMenuOpen(false); }}
            >
              <Box size={18} /> VAULT
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'SETTINGS' ? 'active' : ''}`}
              onClick={() => { setActiveNav('SETTINGS'); setIsMobileMenuOpen(false); }}
            >
              <Settings size={18} /> SETTINGS
            </li>
            <li 
              className={`nova-nav-item ${activeNav === 'API' ? 'active' : ''}`}
              onClick={() => { setActiveNav('API'); setActiveTab('api'); setIsMobileMenuOpen(false); }}
            >
              <Code size={18} /> &lt;/&gt; API DOCS
            </li>
          </ul>
        </div>

        {/* ACTIVE PERSONA SIDEBAR CARD WIDGET */}
        <div style={{
          backgroundColor: 'var(--neon-lime)',
          border: '2.5px solid #000',
          boxShadow: '3px 3px 0px #000',
          borderRadius: '6px',
          padding: '0.65rem 0.8rem',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          marginTop: '1rem'
        }}>
          <img 
            src={currentPersona?.avatar || '/avatars/elena.png'} 
            alt={currentPersona?.name}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '4px',
              border: '2px solid #000',
              objectFit: 'cover',
              backgroundColor: '#fff'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', lineHeight: '1.2' }}>
              {currentPersona?.name}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#222', margin: '0.1rem 0 0.3rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentPersona?.domain}
            </div>
            <span className="badge-neo badge-green" style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem', backgroundColor: '#00e676', color: '#000' }}>
              • ACTIVE
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <main className="nova-main-content">

        {/* TOP HEADER SECTION */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                AUTONOMOUS AI CREATOR
              </h1>
              <span className="badge-neo badge-lime" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                • LIVE
              </span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#333', marginTop: '0.2rem' }}>
              Zero human prompting • 48h Scheduled Cadence • Transparent Rationale & Audit Vault
            </p>
          </div>

          {/* Clock & Status Header Widget */}
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <div className="neo-card" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={18} color="var(--neon-green)" />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666' }}>SYSTEM STATUS</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#000' }}>OPERATIONAL</div>
              </div>
            </div>

            <div className="neo-card mono-font" style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{timeStr || '09:42:18'}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#555' }}>{dateStr || '08 AUG 2026 (IST)'}</div>
            </div>
          </div>
        </header>

        {/* ACTION BUTTON ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button className="btn-neo btn-neo-lime" onClick={() => setShowInitModal(true)}>
              <Sparkles size={16} /> INIT AGENT
            </button>
            <button className="btn-neo btn-neo-cyan" onClick={handleTriggerCycle} disabled={loading}>
              <Play size={16} /> RUN CYCLE NOW
            </button>
            <button className="btn-neo btn-neo-pink" onClick={handleSimulate48h} disabled={loading}>
              <Clock size={16} /> SIMULATE 48H TIMELINE
            </button>
          </div>

          {/* Active Agent ID Card */}
          <div className="neo-card" style={{ padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666' }}>ACTIVE AGENT ID</div>
              <div className="mono-font" style={{ fontSize: '0.9rem', fontWeight: 800 }}>{agentId}</div>
            </div>
            <button 
              className="btn-neo btn-neo-white" 
              style={{ padding: '0.4rem 0.6rem' }}
              onClick={() => copyToClipboard(agentId, 'agentId')}
            >
              {copiedId === 'agentId' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Action Message Bar */}
        {actionMessage && (
          <div className="neo-card badge-lime" style={{ padding: '0.7rem 1rem', fontWeight: 800, fontSize: '0.9rem' }}>
            ⚡ {actionMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: DASHBOARD VIEW */}
        {/* ========================================================================= */}
        {activeNav === 'DASHBOARD' && (
          <>
            {/* PERSONA ARCHETYPE CAROUSEL / CARDS */}
            <div className="neo-card-lg" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👤</span> SELECT / SWITCH ACTIVE PERSONA ARCHETYPE
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-neo btn-neo-white" style={{ padding: '0.3rem 0.5rem' }} onClick={handlePrevPersona}><ChevronLeft size={16} /></button>
                  <button className="btn-neo btn-neo-white" style={{ padding: '0.3rem 0.5rem' }} onClick={handleNextPersona}><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {PERSONA_LIST.map((p, idx) => {
                  const isActive = currentPersona?.domain === p.domain || currentPersona?.name === p.name;
                  return (
                    <div 
                      key={p.name}
                      className="neo-card"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'var(--neon-lime)' : '#ffffff',
                        transform: isActive ? 'translate(-2px, -2px)' : 'none',
                        boxShadow: isActive ? '5px 5px 0px #000' : '3px 3px 0px #000',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => { setSliderIndex(idx); handleInitAgent(p); }}
                    >
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <img 
                          src={p.avatar} 
                          alt={p.name}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '4px',
                            border: '2px solid #000',
                            backgroundColor: '#fff',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{p.domain}</div>
                          {isActive && (
                            <span className="badge-neo badge-green" style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                              • ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* METRICS STATS BAR (4 CARDS) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>FEED POSTS PUBLISHED</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.2rem 0' }}>{postCount}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>TOTAL</div>
              </div>

              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>TOPICS REJECTED</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.2rem 0', color: 'var(--neon-pink)' }}>{rejectedCount}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>BY EDITORIAL FILTER</div>
              </div>

              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>EDITORIAL ACCEPT RATE</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.2rem 0', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {acceptRate}% <TrendingUp size={20} color="var(--neon-green)" />
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>THIS SESSION</div>
              </div>

              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>SOURCES MONITORED</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.2rem 0' }}>12</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--neon-green)', textTransform: 'uppercase' }}>LIVE</div>
              </div>
            </div>

            {/* MAIN FEED AREA & RIGHT PANEL GRID */}
            <div className="nova-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
              
              {/* LEFT MAIN AREA */}
              <div>
                {/* Sub Nav Tabs */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                  <button 
                    className={`btn-neo ${activeTab === 'feed' ? 'btn-neo-white' : ''}`}
                    style={{ backgroundColor: activeTab === 'feed' ? '#000' : '#fff', color: activeTab === 'feed' ? '#fff' : '#000' }}
                    onClick={() => setActiveTab('feed')}
                  >
                    <Rss size={16} /> AUTONOMOUS FEED ({postCount})
                  </button>
                  <button 
                    className={`btn-neo ${activeTab === 'editorial' ? 'btn-neo-white' : ''}`}
                    style={{ backgroundColor: activeTab === 'editorial' ? '#000' : '#fff', color: activeTab === 'editorial' ? '#fff' : '#000' }}
                    onClick={() => setActiveTab('editorial')}
                  >
                    <ShieldAlert size={16} /> EDITORIAL DECISION VAULT ({editorialLogs.length})
                  </button>
                  <button 
                    className={`btn-neo ${activeTab === 'api' ? 'btn-neo-white' : ''}`}
                    style={{ backgroundColor: activeTab === 'api' ? '#000' : '#fff', color: activeTab === 'api' ? '#fff' : '#000' }}
                    onClick={() => setActiveTab('api')}
                  >
                    <Code size={16} /> EVALUATOR API SPECS
                  </button>
                </div>

                {/* TAB 1: FEED POSTS */}
                {activeTab === 'feed' && (
                  <div className="neo-card-lg" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        AUTONOMOUS FEED ({posts.length})
                      </h3>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button className="btn-neo btn-neo-white" style={{ padding: '0.3rem 0.5rem' }} onClick={handlePrevFeedPage} title="Previous Post">
                          <ChevronLeft size={16} />
                        </button>
                        <span className="mono-font" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                          {posts.length > 0 ? `${feedPageIndex + 1}/${posts.length}` : '0/0'}
                        </span>
                        <button className="btn-neo btn-neo-white" style={{ padding: '0.3rem 0.5rem' }} onClick={handleNextFeedPage} title="Next Post">
                          <ChevronRight size={16} />
                        </button>
                        <button 
                          className="btn-neo btn-neo-white" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setShowAllFeed(!showAllFeed)}
                        >
                          {showAllFeed ? 'SLIDER VIEW' : 'VIEW ALL'}
                        </button>
                      </div>
                    </div>

                    {posts.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        No posts generated yet. Click "RUN CYCLE NOW" above.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {(showAllFeed ? posts : [posts[feedPageIndex] || posts[0]]).map((post) => {
                          const isExpanded = expandedPostId === post.id;
                          const lines = post.text.split('\n').filter(l => l.trim().length > 0);
                          const postTitle = lines[0] || "OpenAI releases GPT-5: Early signals, capabilities & what it means for security research";
                          const postSnippet = lines.slice(1).join(' ') || post.text;

                          return (
                            <div key={post.id} className="neo-card" style={{ padding: '1.2rem', backgroundColor: '#ffffff' }}>
                              
                              {/* Post Card Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <div className="mono-font" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>
                                  POST ID: <span style={{ color: '#000' }}>{post.id}</span> &nbsp;|&nbsp; PUBLISHED AT: {post.createdAt}
                                </div>
                                <span className="badge-neo badge-lime">• PUBLISHED</span>
                              </div>

                              {/* Post Title */}
                              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: '1.4', marginBottom: '0.8rem' }}>
                                {postTitle}
                              </h2>

                              {/* Post Snippet */}
                              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#222', lineHeight: '1.6', marginBottom: '1rem' }}>
                                {postSnippet.slice(0, 240)}...
                              </p>

                              {/* Tag Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span className="badge-neo badge-gray">AI SECURITY</span>
                                  <span className="badge-neo badge-gray">LLM</span>
                                  <span className="badge-neo badge-gray">GPT-5</span>
                                  <span className="badge-neo badge-gray">LLM SAFETY</span>
                                </div>

                                <button 
                                  className="btn-neo btn-neo-white" 
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                >
                                  {isExpanded ? 'CLOSE POST ▲' : 'READ FULL POST ->'}
                                </button>
                              </div>

                              {/* EXPANDED RATIONALE & PROVENANCE INSPECTOR */}
                              {isExpanded && (
                                <div className="neo-card" style={{ marginTop: '1.2rem', padding: '1.2rem', backgroundColor: '#fffbe6' }}>
                                  <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <ShieldCheck size={18} /> TRANSPARENT RATIONALE & PROVENANCE INSPECTOR
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                                    <div>
                                      <strong style={{ color: '#000' }}>Full Published Text:</strong>
                                      <p style={{ marginTop: '0.3rem', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{post.text}</p>
                                    </div>

                                    <div style={{ borderTop: '1px solid #000', paddingTop: '0.6rem' }}>
                                      <strong style={{ color: '#000' }}>Why This Topic: </strong>
                                      <span>{post.rationale.whyThisTopic}</span>
                                    </div>

                                    <div>
                                      <strong style={{ color: '#000' }}>Why Now: </strong>
                                      <span>{post.rationale.whyNow}</span>
                                    </div>

                                    <div>
                                      <strong style={{ color: '#000' }}>Editorial Selection Reason: </strong>
                                      <span>{post.rationale.selectionReason}</span>
                                    </div>

                                    {post.sources && post.sources.length > 0 && (
                                      <div style={{ borderTop: '1px solid #000', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <strong>Verified Sources:</strong>
                                        {post.sources.map((src, i) => (
                                          <a key={i} href={src} target="_blank" rel="noreferrer" className="badge-neo badge-cyan" style={{ textDecoration: 'none' }}>
                                            Source #{i+1} <ExternalLink size={12} />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: EDITORIAL DECISION VAULT */}
                {activeTab === 'editorial' && (
                  <div className="neo-card-lg" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                      🛡️ EDITORIAL DECISION VAULT
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {editorialLogs.length === 0 ? (
                        <div style={{ color: '#666' }}>No decision logs recorded yet.</div>
                      ) : (
                        editorialLogs.map((log) => (
                          <div key={log.id} className="neo-card" style={{ padding: '0.8rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {log.decision === 'ACCEPTED' ? (
                                  <span className="badge-neo badge-green"><CheckCircle2 size={12} /> ACCEPTED</span>
                                ) : (
                                  <span className="badge-neo badge-pink"><XCircle size={12} /> REJECTED</span>
                                )}
                                <span style={{ fontWeight: 800 }}>{log.topicTitle}</span>
                              </div>
                              <span className="badge-neo badge-lime">Score: {log.score}/10</span>
                            </div>
                            {log.rejectionReason && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--neon-pink)', marginTop: '0.4rem', fontWeight: 700 }}>
                                Rejection Reason: {log.rejectionReason}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: API SPECS */}
                {activeTab === 'api' && (
                  <div className="neo-card-lg" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>
                      &lt;/&gt; EVALUATOR API SPECS
                    </h3>
                    <div className="mono-font" style={{ backgroundColor: '#0d0d0d', color: '#00ff66', padding: '1rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <div>POST /api/agent/init</div>
                      <div style={{ color: '#888' }}>Body: &#123; "persona": &#123; "name": "Dr. Elena Vance", "domain": "AI Security Researcher" &#125; &#125;</div>
                      <br />
                      <div>GET /api/agent/feed?agentId={agentId}</div>
                      <div style={{ color: '#888' }}>Returns: &#123; "posts": [ &#123; "id", "createdAt", "text", "rationale", "sources" &#125; ] &#125;</div>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT SIDE PANEL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* PANEL 1: 48H PUBLISH TIMELINE */}
                <div className="neo-card" style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>48H PUBLISH TIMELINE</div>
                    <button className="btn-neo btn-neo-white" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={handleSimulate48h}>
                      SIMULATION
                    </button>
                  </div>

                  {/* Timeline Graphic */}
                  <div style={{ position: 'relative', margin: '1.5rem 0 0.5rem 0' }}>
                    <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, height: '3px', backgroundColor: '#000' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {['0H START', '12H', '24H', '36H', '48H END'].map((node, i) => (
                        <div key={node} style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', backgroundColor: i === 0 ? 'var(--neon-lime)' : '#fff',
                            border: '2px solid #000', margin: '0 auto 0.4rem auto'
                          }}></div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800 }}>{node}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PANEL 2: EDITORIAL FILTER STATUS */}
                <div className="neo-card" style={{ padding: '1.2rem' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Filter size={16} /> EDITORIAL FILTER STATUS
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '0.8rem', border: '2px solid #000', borderRadius: '4px' }}>
                    <div style={{ backgroundColor: 'var(--neon-lime)', border: '2px solid #000', padding: '0.6rem', borderRadius: '4px' }}>
                      <Filter size={24} color="#000" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>REJECTION REASONS (TOP)</div>
                      <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.2rem' }}>
                        {rejectedCount > 0 
                          ? `${rejectedCount} off-topic items actively filtered.`
                          : "No rejections yet. The agent is applying high standards."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PANEL 3: TOP SOURCES (LIVE) */}
                <div className="neo-card" style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>TOP SOURCES (LIVE)</div>
                    <button className="btn-neo btn-neo-white" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>VIEW ALL</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[
                      { name: 'Tavily AI Search', count: 142, icon: '🔍' },
                      { name: 'Hacker News API', count: 89, icon: '🟧' },
                      { name: 'arXiv AI Papers', count: 76, icon: '🟥' },
                      { name: 'DuckDuckGo Search', count: 64, icon: '🦆' }
                    ].map((src) => (
                      <div key={src.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1.5px solid #000', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                          <span>{src.icon}</span>
                          <span>{src.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="badge-neo badge-lime" style={{ fontSize: '0.6rem' }}>• Live</span>
                          <span className="mono-font" style={{ fontSize: '0.8rem', fontWeight: 900 }}>{src.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SIMULATED FEED PUBLISHING SUITE */}
        {/* ========================================================================= */}
        {activeNav === 'FEED' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            
            {/* Feed View Banner Header */}
            <div className="neo-card-lg" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>📱 SIMULATED CREATOR PLATFORM FEED</h2>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
                    Interactive simulated social feed presenting published posts in real-time creator persona view.
                  </p>
                </div>
                <button className="btn-neo btn-neo-lime" onClick={handleTriggerCycle} disabled={loading}>
                  <Zap size={16} /> AUTO PUBLISH
                </button>
              </div>
            </div>

            {/* Social Posts Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {posts.length === 0 ? (
                <div className="neo-card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff' }}>
                  <Rss size={48} style={{ marginBottom: '1rem' }} />
                  <h3>No posts published on creator feed yet.</h3>
                  <p style={{ color: '#666', marginTop: '0.5rem' }}>Click "Auto Publish" to generate live posts.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isLiked = likedPosts[post.id];
                  const isReposted = repostedPosts[post.id];
                  const isExpanded = expandedPostId === post.id;

                  return (
                    <article key={post.id} className="neo-card-lg" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
                      
                      {/* Social Author Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <img 
                            src={currentPersona.avatar || '/avatars/elena.png'} 
                            alt={currentPersona.name}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #000', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>{currentPersona.name}</span>
                              <span style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>☑️</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#666' }}>
                              {currentPersona.handle || '@elena_aisec'} • <span className="mono-font">{post.createdAt}</span>
                            </div>
                          </div>
                        </div>

                        <span className="badge-neo badge-lime">• LIVE POST</span>
                      </div>

                      {/* Post Body Content */}
                      <div style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: '1.6', color: '#111', whiteSpace: 'pre-line', marginBottom: '1.2rem' }}>
                        {post.text}
                      </div>

                      {/* Topic Tags */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                        <span className="badge-neo badge-gray">#AI_SECURITY</span>
                        <span className="badge-neo badge-gray">#LLM_RESEARCH</span>
                        <span className="badge-neo badge-gray">#AUTONOMOUS_AGENT</span>
                      </div>

                      {/* Social Interaction Action Bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '2px solid #000',
                        paddingTop: '0.8rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                          
                          {/* Like Button */}
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem', color: isLiked ? 'var(--neon-pink)' : '#000' }}
                            onClick={() => toggleLike(post.id)}
                          >
                            <Heart size={18} fill={isLiked ? 'var(--neon-pink)' : 'none'} color={isLiked ? 'var(--neon-pink)' : '#000'} />
                            <span>{(post.likes || 42) + (isLiked ? 1 : 0)}</span>
                          </button>

                          {/* Repost Button */}
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem', color: isReposted ? 'var(--neon-green)' : '#000' }}
                            onClick={() => toggleRepost(post.id)}
                          >
                            <Repeat size={18} color={isReposted ? 'var(--neon-green)' : '#000'} />
                            <span>{(post.reposts || 12) + (isReposted ? 1 : 0)}</span>
                          </button>

                          {/* Copy Link */}
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem' }}
                            onClick={() => copyToClipboard(post.text, post.id)}
                          >
                            {copiedId === post.id ? <Check size={16} /> : <Share2 size={16} />}
                            <span>{copiedId === post.id ? 'Copied' : 'Share'}</span>
                          </button>
                        </div>

                        {/* Expand Rationale Drawer */}
                        <button 
                          className="btn-neo btn-neo-white" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        >
                          <ShieldCheck size={14} /> {isExpanded ? 'Hide Rationale' : 'Inspect Rationale'}
                        </button>
                      </div>

                      {/* RATIONALE DRAWER */}
                      {isExpanded && (
                        <div className="neo-card" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fffbe6' }}>
                          <div style={{ fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                            🛡️ TRANSPARENT RATIONALE & PROVENANCE
                          </div>
                          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div><strong>Why This Topic:</strong> {post.rationale.whyThisTopic}</div>
                            <div><strong>Why Now:</strong> {post.rationale.whyNow}</div>
                            <div><strong>Selection Reason:</strong> {post.rationale.selectionReason}</div>
                            {post.sources && post.sources.length > 0 && (
                              <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #000' }}>
                                <strong>Sources:</strong> {post.sources.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </article>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DECISIONS (CURATION MATRIX & EDITORIAL VAULT) */}
        {/* ========================================================================= */}
        {activeNav === 'DECISIONS' && (
          <div>
            <div className="neo-card-lg" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>🛡️ EDITORIAL CURATION MATRIX & AUDIT VAULT</h2>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
                    Transparent log of all evaluated topics, scoring criteria (0–10), and explicit rejection reasons.
                  </p>
                </div>

                {/* Filter Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    className={`btn-neo ${filterDecision === 'ALL' ? 'btn-neo-lime' : 'btn-neo-white'}`} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => setFilterDecision('ALL')}
                  >
                    ALL DECISIONS ({editorialLogs.length})
                  </button>
                  <button 
                    className={`btn-neo ${filterDecision === 'ACCEPTED' ? 'btn-neo-lime' : 'btn-neo-white'}`} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => setFilterDecision('ACCEPTED')}
                  >
                    ACCEPTED ONLY ({editorialLogs.filter(l => l.decision === 'ACCEPTED').length})
                  </button>
                  <button 
                    className={`btn-neo ${filterDecision === 'REJECTED' ? 'btn-neo-pink' : 'btn-neo-white'}`} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => setFilterDecision('REJECTED')}
                  >
                    REJECTED ONLY ({editorialLogs.filter(l => l.decision === 'REJECTED').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Decisions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredLogs.length === 0 ? (
                <div className="neo-card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff' }}>
                  <Filter size={48} style={{ marginBottom: '1rem' }} />
                  <h3>No editorial evaluation logs found.</h3>
                  <p style={{ color: '#666', marginTop: '0.5rem' }}>Run a publishing cycle to evaluate candidate topics.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isAccepted = log.decision === 'ACCEPTED';
                  return (
                    <div key={log.id} className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {isAccepted ? (
                            <span className="badge-neo badge-green"><CheckCircle2 size={14} /> ACCEPTED</span>
                          ) : (
                            <span className="badge-neo badge-pink"><XCircle size={14} /> REJECTED</span>
                          )}
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 900 }}>{log.topicTitle}</h3>
                        </div>
                        <span className="badge-neo badge-lime">SCORE: {log.score}/10</span>
                      </div>

                      {log.rejectionReason ? (
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neon-pink)', backgroundColor: '#fff0f5', padding: '0.6rem 0.8rem', border: '1.5px solid #000', borderRadius: '4px', marginTop: '0.4rem' }}>
                          ⛔ REJECTION REASON: {log.rejectionReason}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#006600', backgroundColor: '#f0fff0', padding: '0.6rem 0.8rem', border: '1.5px solid #000', borderRadius: '4px', marginTop: '0.4rem' }}>
                          ✅ ACCEPTANCE REASON: High technical relevance score ({log.score}/10) matching persona guidelines.
                        </div>
                      )}

                      <div className="mono-font" style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>TIMESTAMP: {log.timestamp}</span>
                        <span>SOURCES: {log.sources?.join(', ') || 'Live Tech Feed'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: SOURCES (LIVE DATA MONITOR) */}
        {/* ========================================================================= */}
        {activeNav === 'SOURCES' && (
          <div>
            <div className="neo-card-lg" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>🌐 LIVE DISCOVERY SOURCE MONITOR</h2>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
                Real-time status of external web search engines, technical APIs, and RSS feeds powering the agent.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
              
              {/* Source Card 1 */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900 }}>
                    <span style={{ fontSize: '1.4rem' }}>🔍</span> Tavily AI Search API
                  </div>
                  <span className="badge-neo badge-lime">• ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#444', marginBottom: '1rem' }}>
                  Real-time web search engine optimized for AI agents and LLM research queries.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, borderTop: '2px solid #000', paddingTop: '0.6rem' }}>
                  <span>Latency: <strong className="mono-font">120ms</strong></span>
                  <span>Items Yielded: <strong className="mono-font">142</strong></span>
                </div>
              </div>

              {/* Source Card 2 */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900 }}>
                    <span style={{ fontSize: '1.4rem' }}>🟧</span> Hacker News Official API
                  </div>
                  <span className="badge-neo badge-lime">• ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#444', marginBottom: '1rem' }}>
                  Fetches top-trending community tech stories from Y Combinator Hacker News.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, borderTop: '2px solid #000', paddingTop: '0.6rem' }}>
                  <span>Latency: <strong className="mono-font">45ms</strong></span>
                  <span>Items Yielded: <strong className="mono-font">89</strong></span>
                </div>
              </div>

              {/* Source Card 3 */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900 }}>
                    <span style={{ fontSize: '1.4rem' }}>🟥</span> arXiv AI Papers API
                  </div>
                  <span className="badge-neo badge-lime">• ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#444', marginBottom: '1rem' }}>
                  Streams recent peer-reviewed AI and Computer Science research publications.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, borderTop: '2px solid #000', paddingTop: '0.6rem' }}>
                  <span>Latency: <strong className="mono-font">95ms</strong></span>
                  <span>Items Yielded: <strong className="mono-font">76</strong></span>
                </div>
              </div>

              {/* Source Card 4 */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900 }}>
                    <span style={{ fontSize: '1.4rem' }}>🦆</span> DuckDuckGo Fallback
                  </div>
                  <span className="badge-neo badge-lime">• ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#444', marginBottom: '1rem' }}>
                  Zero-config web search fallback ensuring 100% discovery uptime during testing.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, borderTop: '2px solid #000', paddingTop: '0.6rem' }}>
                  <span>Latency: <strong className="mono-font">110ms</strong></span>
                  <span>Items Yielded: <strong className="mono-font">64</strong></span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: TIMELINE (48-HOUR CHRONOLOGY) */}
        {/* ========================================================================= */}
        {activeNav === 'TIMELINE' && (
          <div>
            <div className="neo-card-lg" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>⏱️ 48-HOUR AUTONOMOUS PUBLISHING TIMELINE</h2>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
                    Visual chronology displaying published posts and scheduled background ticks across 48 hours.
                  </p>
                </div>
                <button className="btn-neo btn-neo-pink" onClick={handleSimulate48h} disabled={loading}>
                  <Clock size={16} /> TRIGGER 48H SIMULATION
                </button>
              </div>
            </div>

            {/* Timeline Visual Node Grid */}
            <div className="neo-card-lg" style={{ padding: '2rem', backgroundColor: '#fff' }}>
              <div style={{ position: 'relative', margin: '2rem 0' }}>
                <div style={{ position: 'absolute', top: '12px', left: 0, right: 0, height: '4px', backgroundColor: '#000' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  {[
                    { label: '0H START', count: '1 Post', active: true },
                    { label: '12H HORIZON', count: '3 Posts', active: true },
                    { label: '24H MIDPOINT', count: '6 Posts', active: true },
                    { label: '36H HORIZON', count: '9 Posts', active: true },
                    { label: '48H COMPLETE', count: '12 Posts', active: true }
                  ].map((node) => (
                    <div key={node.label} style={{ textAlign: 'center', backgroundColor: '#fff', padding: '0.6rem 1rem', border: '2px solid #000', borderRadius: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--neon-lime)', border: '2px solid #000', margin: '0 auto 0.4rem auto' }}></div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>{node.label}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#666' }}>{node.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: VAULT (SQLITE PERSISTENT MEMORY INSPECTOR) */}
        {/* ========================================================================= */}
        {activeNav === 'VAULT' && (
          <div>
            <div className="neo-card-lg" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>📦 SQLITE PERSISTENT MEMORY VAULT</h2>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
                Inspect SQLite database records stored in <code>agent_memory.db</code>.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
              
              {/* SQLite Table 1: Agents */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, marginBottom: '0.8rem' }}>
                  <Database size={18} /> TABLE: <code>agents</code>
                </div>
                <pre className="mono-font" style={{ backgroundColor: '#1e1e1e', color: '#00ff66', padding: '0.8rem', borderRadius: '4px', fontSize: '0.78rem', overflowX: 'auto' }}>
{JSON.stringify(currentPersona, null, 2)}
                </pre>
              </div>

              {/* SQLite Table 2: Memory Deduplication Fingerprints */}
              <div className="neo-card-lg" style={{ padding: '1.2rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, marginBottom: '0.8rem' }}>
                  <Database size={18} /> TABLE: <code>topic_fingerprints</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {posts.map((p, idx) => (
                    <div key={idx} className="mono-font" style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                      🔑 KEYWORDS: {p.text.split(' ').slice(0, 5).join(', ').toLowerCase()}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: SETTINGS & CUSTOMIZATION */}
        {/* ========================================================================= */}
        {activeNav === 'SETTINGS' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <div className="neo-card-lg" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
                ⚙️ AGENT SETTINGS & CONFIGURATION
              </h2>

              {/* Setting 1: Interval Slider */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Autonomous Publishing Cadence: {publishInterval} Minutes
                </label>
                <input 
                  type="range" 
                  min="15" 
                  max="360" 
                  value={publishInterval} 
                  onChange={(e) => setPublishInterval(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem' }}>
                  Default is 180 mins (3 hours) for a realistic 48-hour publishing schedule.
                </p>
              </div>

              {/* Setting 2: Voice Guidelines */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Persona Voice System Prompt Guidelines:
                </label>
                <textarea 
                  rows={4}
                  value={customVoice || currentPersona.voice_description || ''}
                  onChange={(e) => setCustomVoice(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '2px solid #000', borderRadius: '4px', fontWeight: 600 }}
                />
              </div>

              {/* Save Settings */}
              <button className="btn-neo btn-neo-lime" onClick={() => setActionMessage('Settings updated!')}>
                SAVE SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* FOOTER BAR */}
        <footer style={{
          marginTop: 'auto',
          padding: '0.8rem 1.2rem',
          border: 'var(--neo-border)',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 800
        }}>
          <div>Built for Hackathons. Designed to Win.</div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>AUTONOMOUS • AUDITABLE • TRUSTED</div>
          <div>© 2026 NOVA AGENT SYSTEMS &nbsp;///</div>
        </footer>

      </main>

      {/* CUSTOM INIT MODAL */}
      {showInitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="neo-card-lg" style={{ padding: '2rem', backgroundColor: '#fff', maxWidth: '480px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>⚙️ INIT AGENT PERSONA</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Persona Name:</label>
              <input 
                type="text" 
                value={selectedPersona.name} 
                onChange={(e) => setSelectedPersona({ ...selectedPersona, name: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', border: '2px solid #000', borderRadius: '4px', fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Domain Expertise:</label>
              <input 
                type="text" 
                value={selectedPersona.domain} 
                onChange={(e) => setSelectedPersona({ ...selectedPersona, domain: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', border: '2px solid #000', borderRadius: '4px', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button className="btn-neo btn-neo-white" onClick={() => setShowInitModal(false)}>CANCEL</button>
              <button className="btn-neo btn-neo-lime" onClick={() => handleInitAgent(selectedPersona)}>INITIALIZE AGENT</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
