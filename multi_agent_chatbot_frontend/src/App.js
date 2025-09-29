import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';

/**
 * Ocean Professional Theme Tokens
 * Using vibrant, playful palette with soft rounded corners and subtle gradients.
 */
const themeTokens = {
  primary: '#EC4899',
  secondary: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  background: '#FDF2F8',
  surface: '#FFFFFF',
  text: '#374151',
  gradient: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(139,92,246,0.12), rgba(59,130,246,0.10))',
  bubbleUser: '#EC4899',
  bubbleAgent: '#8B5CF6',
};

// Example agents to visualize multi-agent conversation
const EXAMPLE_AGENTS = [
  {
    id: 'agent_rag',
    name: 'RAG Researcher',
    color: themeTokens.secondary,
    emoji: '🧠',
  },
  {
    id: 'agent_planner',
    name: 'MCP Planner',
    color: themeTokens.primary,
    emoji: '🗺️',
  },
];

// PUBLIC_INTERFACE
function App() {
  /**
   * State
   */
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      role: 'agent',
      agentId: 'agent_rag',
      content:
        "Hello! I'm your RAG Researcher. Ask me anything and I'll fetch relevant knowledge to help us.",
      timestamp: Date.now() - 60_000,
    },
    {
      id: 'm2',
      role: 'agent',
      agentId: 'agent_planner',
      content:
        "And I’m the MCP Planner! I’ll organize steps and coordinate agents to build complete answers.",
      timestamp: Date.now() - 45_000,
    },
  ]);
  const [input, setInput] = useState('');
  const [agentStatus, setAgentStatus] = useState({
    agent_rag: 'idle',
    agent_planner: 'idle',
  });
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState('light');
  const chatRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  /**
   * API base URL.
   * IMPORTANT: Ask user to provide REACT_APP_BACKEND_URL in environment. Do not hardcode.
   * If not provided, defaults to empty string which assumes same origin proxy.
   *
   * Required env var:
   * - REACT_APP_BACKEND_URL: Base URL of backend API (e.g., http://localhost:8000)
   */
  const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

  /**
   * Placeholder API methods to integrate with backend REST endpoints.
   * Replace endpoint paths according to your backend.
   */

  // PUBLIC_INTERFACE
  const sendMessageToBackend = async (text) => {
    /**
     * Sends a user message to the backend and returns the response payload.
     * Expected backend endpoint (placeholder): POST {API_BASE}/api/chat/message
     * Body: { message: string }
     * Response: { messages: Array<{role: 'agent'|'user', agentId?: string, content: string, timestamp?: number}>, agentStatus?: Record<string, string> }
     */
    const url = `${API_BASE}/api/chat/message`;
    const payload = { message: text };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Backend error: ${msg || res.status}`);
      }

      // Example schematic response
      // In absence of backend, simulate a response to keep UI engaging
      const data =
        (await res.json().catch(() => null)) ||
        simulateAgentResponse(text); // fallback simulation

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // PUBLIC_INTERFACE
  const fetchAgentStatus = async () => {
    /**
     * Fetch current agent status.
     * Placeholder endpoint: GET {API_BASE}/api/chat/agents/status
     * Response: { agentStatus: Record<string, 'idle'|'thinking'|'responding'|'error'> }
     */
    const url = `${API_BASE}/api/chat/agents/status`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch agent status: ${res.status}`);
      const data = (await res.json().catch(() => null)) || { agentStatus };
      return data;
    } catch (e) {
      console.warn('Agent status fallback:', e.message);
      return { agentStatus };
    }
  };

  // PUBLIC_INTERFACE
  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setAgentStatus((s) => ({ ...s, agent_rag: 'thinking', agent_planner: 'idle' }));

    try {
      const data = await sendMessageToBackend(userMessage.content);

      if (Array.isArray(data?.messages)) {
        setMessages((prev) => [
          ...prev,
          ...data.messages.map((m, idx) => ({
            id: `a_${Date.now()}_${idx}`,
            role: m.role,
            agentId: m.agentId,
            content: m.content,
            timestamp: m.timestamp || Date.now(),
          })),
        ]);
      }

      if (data?.agentStatus) {
        setAgentStatus((prev) => ({ ...prev, ...data.agentStatus }));
      } else {
        setAgentStatus({ agent_rag: 'responding', agent_planner: 'thinking' });
        setTimeout(() => {
          setAgentStatus({ agent_rag: 'idle', agent_planner: 'idle' });
        }, 1200);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'system',
          content:
            'Oops! Something went wrong talking to the backend. Please check your connection and try again.',
          timestamp: Date.now(),
          error: true,
        },
      ]);
      setAgentStatus({ agent_rag: 'error', agent_planner: 'idle' });
    } finally {
      setIsSending(false);
    }
  };

  // Enter to send
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simulate agent response if backend not available
  const simulateAgentResponse = (text) => {
    const lower = text.toLowerCase();
    const helpful = lower.includes('plan') || lower.includes('how');
    const ragReply =
      'I searched our knowledge base and found related insights to your question.';
    const plannerReply = helpful
      ? 'Here is a step-by-step plan: 1) Analyze 2) Retrieve 3) Synthesize 4) Validate.'
      : 'I will coordinate the agents to craft a helpful reply.';

    return {
      messages: [
        {
          role: 'agent',
          agentId: 'agent_rag',
          content: `${ragReply} "${text.slice(0, 60)}"`,
        },
        {
          role: 'agent',
          agentId: 'agent_planner',
          content: plannerReply,
        },
      ],
      agentStatus: { agent_rag: 'responding', agent_planner: 'thinking' },
    };
  };

  const statusData = useMemo(() => {
    return EXAMPLE_AGENTS.map((a) => ({
      ...a,
      status: agentStatus[a.id] || 'idle',
    }));
  }, [agentStatus]);

  return (
    <div style={styles.appWrapper(themeTokens)}>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <AgentBar agents={statusData} />
      <main style={styles.main}>
        <div ref={chatRef} style={styles.chatWindow}>
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>
      </main>
      <Composer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onKeyDown={onKeyDown}
        isSending={isSending}
      />
      <FooterNote />
    </div>
  );
}

/**
 * Header with playful gradient and rounded corners
 */
function Header({ theme, toggleTheme }) {
  return (
    <header style={styles.header}>
      <div style={styles.brandRow}>
        <div style={styles.logoCircle}>🌊</div>
        <div style={styles.brandText}>
          <div style={styles.title}>Ocean Chat</div>
          <div style={styles.subtitle}>Multi-Agent Playground</div>
        </div>
      </div>
      <button style={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </header>
  );
}

/**
 * AgentBar shows agents and their status with animated indicators
 */
function AgentBar({ agents }) {
  return (
    <section style={styles.agentBar}>
      {agents.map((a) => (
        <div key={a.id} style={{ ...styles.agentPill, borderColor: a.color }}>
          <span style={styles.agentEmoji}>{a.emoji}</span>
          <span style={styles.agentName}>{a.name}</span>
          <AgentStatus status={a.status} color={a.color} />
        </div>
      ))}
    </section>
  );
}

/**
 * Animated status indicator
 */
function AgentStatus({ status, color }) {
  const label =
    status === 'thinking'
      ? 'Thinking'
      : status === 'responding'
      ? 'Responding'
      : status === 'error'
      ? 'Error'
      : 'Idle';

  return (
    <span style={styles.statusWrapper}>
      <span style={{ ...styles.pulseDot, backgroundColor: color, opacity: status === 'idle' ? 0.35 : 1 }} />
      <span style={styles.statusText}>{label}</span>
    </span>
  );
}

/**
 * Chat bubble component with role styles
 */
function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';
  const isSystem = message.role === 'system';

  const base = {
    ...styles.bubbleBase,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser
      ? themeTokens.bubbleUser
      : isAgent
      ? themeTokens.bubbleAgent
      : '#ef4444',
  };

  const meta = isAgent
    ? EXAMPLE_AGENTS.find((a) => a.id === message.agentId)
    : null;

  return (
    <div style={{ ...styles.bubbleRow, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && !isSystem && (
        <div style={{ ...styles.avatar, background: meta?.color || themeTokens.secondary }}>
          {meta?.emoji || '🤖'}
        </div>
      )}
      <div style={base}>
        {isAgent && (
          <div style={styles.bubbleHeader}>
            <span style={styles.bubbleHeaderName}>
              {meta?.emoji} {meta?.name || 'Agent'}
            </span>
          </div>
        )}
        <div style={styles.bubbleText}>{message.content}</div>
        <div style={styles.bubbleTime}>
          {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Composer: input and send button
 */
function Composer({ value, onChange, onSend, onKeyDown, isSending }) {
  return (
    <div style={styles.composerWrap}>
      <div style={styles.composer}>
        <textarea
          style={styles.textarea}
          placeholder="Type your message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: isSending ? 0.7 : 1 }}
          onClick={onSend}
          disabled={isSending}
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function FooterNote() {
  return (
    <div style={styles.footerNote}>
      Tip: Press Enter to send, Shift+Enter for a new line.
    </div>
  );
}

/**
 * Inline styles for simplicity within this template.
 * For larger projects, use CSS Modules or styled-components.
 */
const styles = {
  appWrapper: (t) => ({
    minHeight: '100vh',
    background: `${t.background}`,
    color: t.text,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  }),
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: themeTokens.gradient,
    backdropFilter: 'blur(6px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background:
      'linear-gradient(135deg, rgba(236,72,153,0.65), rgba(139,92,246,0.65))',
    boxShadow: '0 8px 24px rgba(236,72,153,0.25)',
  },
  brandText: { display: 'flex', flexDirection: 'column' },
  title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.2 },
  subtitle: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  themeBtn: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    padding: '8px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
  agentBar: {
    display: 'flex',
    gap: 10,
    padding: '10px 14px',
    flexWrap: 'wrap',
  },
  agentPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fff',
    border: '2px solid',
    padding: '8px 10px',
    borderRadius: 14,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  agentEmoji: { fontSize: 16 },
  agentName: { fontWeight: 700, fontSize: 13 },
  statusWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    animation: 'pulse 1.2s infinite ease-in-out',
  },
  statusText: { fontSize: 12, opacity: 0.8 },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '8px 12px 96px',
  },
  chatWindow: {
    flex: 1,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.6))',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 16,
    padding: 12,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  bubbleRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
    color: '#fff',
    fontSize: 14,
  },
  bubbleBase: {
    maxWidth: '86%',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: 16,
    boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
  },
  bubbleHeader: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.95,
    marginBottom: 4,
  },
  bubbleHeaderName: {},
  bubbleText: { fontSize: 14, lineHeight: 1.45 },
  bubbleTime: { fontSize: 10, opacity: 0.8, marginTop: 6 },
  composerWrap: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    background:
      'linear-gradient(180deg, rgba(253,242,248,0.60), rgba(253,242,248,0.95))',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    backdropFilter: 'blur(8px)',
  },
  composer: {
    maxWidth: 960,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 16,
    display: 'flex',
    gap: 10,
    padding: 10,
    boxShadow: '0 10px 40px rgba(236,72,153,0.09)',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.4,
    padding: 8,
    borderRadius: 10,
  },
  sendBtn: {
    background:
      'linear-gradient(135deg, rgba(236,72,153,0.95), rgba(139,92,246,0.95))',
    border: 'none',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: 12,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(139,92,246,0.25)',
  },
  footerNote: {
    position: 'fixed',
    bottom: 70,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.65,
    pointerEvents: 'none',
  },
};

// Keyframe injection for pulse animation
const styleEl = document.createElement('style');
styleEl.innerHTML = `
@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}
`;
document.head.appendChild(styleEl);

export default App;
