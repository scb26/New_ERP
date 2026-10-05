/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Users, MessageSquare, Bot, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import type { AgentId, ChatMessage, GeminiHistoryEntry, ConversationMap, HistoryMap } from '../types/aiTeam';

// ─── Agent Config (mirrors server) ──────────────────────────────────────────

interface AgentMeta {
  id: AgentId;
  name: string;
  shortName: string;
  role: string;
  emoji: string;
  color: string;
}

const AGENT_DESCRIPTIONS: Record<AgentId, string> = {
  'product-manager': 'Requirements, user stories, backlog, feature specs',
  'developer': 'Code, architecture, implementation, debugging',
  'qa-engineer': 'Test cases, edge cases, bug reports, quality review',
  'release-manager': 'Changelogs, deployment checklists, versioning',
  'tech-lead': 'Architecture decisions, team orchestration, final calls',
};

const AGENT_BG: Record<AgentId, string> = {
  'product-manager': 'rgba(139,92,246,0.08)',
  'developer': 'rgba(59,130,246,0.08)',
  'qa-engineer': 'rgba(16,185,129,0.08)',
  'release-manager': 'rgba(245,158,11,0.08)',
  'tech-lead': 'rgba(239,68,68,0.08)',
};

const AGENT_BORDER: Record<AgentId, string> = {
  'product-manager': 'rgba(139,92,246,0.25)',
  'developer': 'rgba(59,130,246,0.25)',
  'qa-engineer': 'rgba(16,185,129,0.25)',
  'release-manager': 'rgba(245,158,11,0.25)',
  'tech-lead': 'rgba(239,68,68,0.25)',
};

const DEFAULT_AGENT_ID: AgentId = 'developer';

// ─── Sub-Components ──────────────────────────────────────────────────────────

const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

/** Render markdown-like formatting for agent responses */
const AgentResponseText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // Bold headings: **text** or ### text
        if (/^#{1,3}\s/.test(line)) {
          const content = line.replace(/^#{1,3}\s/, '');
          return <p key={i} className="font-bold text-white mt-2 first:mt-0">{renderInline(content)}</p>;
        }
        // Bullet points
        if (/^[-*•]\s/.test(line)) {
          const content = line.replace(/^[-*•]\s/, '');
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
              <span>{renderInline(content)}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split('. ');
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 text-[10px] font-black opacity-50 mt-0.5">{num}.</span>
              <span>{renderInline(rest.join('. '))}</span>
            </div>
          );
        }
        // Code block marker lines (```) — skip them visually
        if (/^```/.test(line)) return null;
        // Empty line = spacer
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.5 bg-white/10 rounded text-[11px] font-mono text-blue-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AITeam() {
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>(DEFAULT_AGENT_ID);
  const [mode, setMode] = useState<'individual' | 'team-discussion'>('individual');
  const [conversations, setConversations] = useState<ConversationMap>({} as ConversationMap);
  const [discussionMessages, setDiscussionMessages] = useState<ChatMessage[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<HistoryMap>({} as HistoryMap);
  const [discussionHistory, setDiscussionHistory] = useState<GeminiHistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch agents list from server
  useEffect(() => {
    fetch('/api/ai-team/agents')
      .then(r => r.json())
      .then((data: AgentMeta[]) => setAgents(data))
      .catch(() => setError('Could not load AI team. Is the server running?'));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, discussionMessages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const currentMessages: ChatMessage[] =
    mode === 'team-discussion'
      ? discussionMessages
      : (conversations[selectedAgentId] || []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setError(null);
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    if (mode === 'team-discussion') {
      setDiscussionMessages(prev => [...prev, userMsg]);
      try {
        const res = await fetch('/api/ai-team/discuss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: trimmed, history: discussionHistory }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        const aiMsg: ChatMessage = {
          id: `${Date.now()}-model`,
          role: 'model',
          text: data.response,
          timestamp: new Date(),
        };
        setDiscussionMessages(prev => [...prev, aiMsg]);
        setDiscussionHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text: trimmed }] },
          { role: 'model', parts: [{ text: data.response }] },
        ]);
      } catch (e: any) {
        setError(e.message || 'Something went wrong.');
        setDiscussionMessages(prev => prev.slice(0, -1));
      }
    } else {
      setConversations(prev => ({
        ...prev,
        [selectedAgentId]: [...(prev[selectedAgentId] || []), userMsg],
      }));
      const currentHistory = geminiHistory[selectedAgentId] || [];
      try {
        const res = await fetch('/api/ai-team/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgentId,
            message: trimmed,
            history: currentHistory,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        const aiMsg: ChatMessage = {
          id: `${Date.now()}-model`,
          role: 'model',
          text: data.response,
          agentId: selectedAgentId,
          timestamp: new Date(),
        };
        setConversations(prev => ({
          ...prev,
          [selectedAgentId]: [...(prev[selectedAgentId] || []), aiMsg],
        }));
        setGeminiHistory(prev => ({
          ...prev,
          [selectedAgentId]: [
            ...(prev[selectedAgentId] || []),
            { role: 'user', parts: [{ text: trimmed }] },
            { role: 'model', parts: [{ text: data.response }] },
          ],
        }));
      } catch (e: any) {
        setError(e.message || 'Something went wrong.');
        setConversations(prev => ({
          ...prev,
          [selectedAgentId]: (prev[selectedAgentId] || []).slice(0, -1),
        }));
      }
    }

    setIsLoading(false);
  }, [input, isLoading, mode, selectedAgentId, discussionHistory, geminiHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (mode === 'team-discussion') {
      setDiscussionMessages([]);
      setDiscussionHistory([]);
    } else {
      setConversations(prev => ({ ...prev, [selectedAgentId]: [] }));
      setGeminiHistory(prev => ({ ...prev, [selectedAgentId]: [] }));
    }
    setError(null);
  };

  const accentColor = selectedAgent?.color || '#3B82F6';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Bot size={22} className="text-blue-500" />
            </div>
            AI Development Team
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-13">Your AI-powered engineering squad</p>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center gap-2 p-1 bg-[#111111] rounded-2xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => setMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'individual'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <MessageSquare size={14} /> Individual Chat
          </button>
          <button
            onClick={() => setMode('team-discussion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'team-discussion'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Users size={14} /> Team Discussion
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0" style={{ minHeight: '600px' }}>
        {/* ── Sidebar: Agent Cards ─────────────────────────────────────────── */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-3">
          {mode === 'team-discussion' ? (
            <div className="p-5 rounded-[24px] border border-white/5 bg-[#0A0A0A] space-y-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Team Mode</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ask anything — <strong className="text-white">Zara (Tech Lead)</strong> will orchestrate responses from the whole team.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {agents.map(a => (
                  <span
                    key={a.id}
                    title={a.role}
                    className="text-lg cursor-default"
                    style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                  >
                    {a.emoji}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            agents.map(agent => {
              const isActive = selectedAgentId === agent.id;
              const msgCount = (conversations[agent.id as AgentId] || []).length;
              return (
                <motion.button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id as AgentId)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full p-4 rounded-2xl text-left transition-all border flex items-start gap-3 ${
                    isActive
                      ? 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                      : 'border-white/5 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-white/10'
                  }`}
                  style={isActive ? {
                    background: AGENT_BG[agent.id as AgentId],
                    borderColor: AGENT_BORDER[agent.id as AgentId],
                  } : {}}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${agent.color}20` }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {agent.shortName}
                      </p>
                      {msgCount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-gray-500 shrink-0">
                          {msgCount / 2}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium truncate mt-0.5">{agent.role}</p>
                  </div>
                  {isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 animate-pulse"
                      style={{ background: agent.color }}
                    />
                  )}
                </motion.button>
              );
            })
          )}

          {/* Separator + quick prompts */}
          {mode === 'individual' && selectedAgent && (
            <div className="mt-2 p-4 rounded-2xl border border-white/5 bg-[#0A0A0A]">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Quick Prompts</p>
              <div className="space-y-2">
                {getQuickPrompts(selectedAgentId).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left text-[10px] text-gray-500 hover:text-blue-400 font-medium py-1.5 px-2 rounded-lg hover:bg-blue-600/5 transition-all"
                  >
                    → {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Chat Panel ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden min-h-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              {mode === 'team-discussion' ? (
                <>
                  <div className="flex -space-x-2">
                    {agents.slice(0, 4).map(a => (
                      <div
                        key={a.id}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-[#0A0A0A]"
                        style={{ background: `${a.color}30` }}
                        title={a.shortName}
                      >
                        {a.emoji}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Team Discussion</p>
                    <p className="text-[10px] text-gray-500">All agents via Zara (Tech Lead)</p>
                  </div>
                </>
              ) : selectedAgent ? (
                <>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${selectedAgent.color}25` }}
                  >
                    {selectedAgent.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedAgent.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {AGENT_DESCRIPTIONS[selectedAgent.id as AgentId]}
                    </p>
                  </div>
                  {/* Active indicator */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </>
              ) : null}
            </div>
            {currentMessages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {currentMessages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-inner"
                  style={
                    mode === 'team-discussion'
                      ? { background: 'rgba(59,130,246,0.1)' }
                      : { background: AGENT_BG[selectedAgentId] }
                  }
                >
                  {mode === 'team-discussion' ? '🤝' : (selectedAgent?.emoji || '🤖')}
                </div>
                <h3 className="text-base font-bold text-gray-400 mb-2">
                  {mode === 'team-discussion'
                    ? 'Start a team discussion'
                    : `Chat with ${selectedAgent?.shortName || 'your agent'}`}
                </h3>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                  {mode === 'team-discussion'
                    ? 'Ask about features, architecture, releases, or anything ERP-related. The whole team will weigh in.'
                    : `Ask ${selectedAgent?.shortName} about ${AGENT_DESCRIPTIONS[selectedAgentId]?.toLowerCase()}`}
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {currentMessages.map((msg) => {
                const isUser = msg.role === 'user';
                const msgAgent = mode === 'team-discussion'
                  ? agents.find(a => a.id === 'tech-lead')
                  : agents.find(a => a.id === selectedAgentId);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5"
                        style={{ background: `${msgAgent?.color || accentColor}25` }}
                      >
                        {mode === 'team-discussion' ? '🤝' : msgAgent?.emoji}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'rounded-bl-sm'
                      }`}
                      style={
                        !isUser
                          ? {
                              background: AGENT_BG[selectedAgentId],
                              border: `1px solid ${AGENT_BORDER[selectedAgentId]}`,
                              color: '#d1d5db',
                            }
                          : {}
                      }
                    >
                      {isUser ? (
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      ) : (
                        <AgentResponseText text={msg.text} />
                      )}
                      <p className="text-[9px] opacity-40 mt-1.5 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Loading bubble */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5"
                  style={{ background: `${accentColor}25` }}
                >
                  {mode === 'team-discussion' ? '🤝' : selectedAgent?.emoji}
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm"
                  style={{
                    background: AGENT_BG[selectedAgentId],
                    border: `1px solid ${AGENT_BORDER[selectedAgentId]}`,
                    color: accentColor,
                  }}
                >
                  <TypingDots />
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-5 py-4 border-t border-white/5 shrink-0">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'team-discussion'
                      ? 'Ask the whole team a question…'
                      : `Message ${selectedAgent?.shortName || 'agent'}… (Enter to send)`
                  }
                  rows={1}
                  className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-3 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/30 transition-all resize-none custom-scrollbar"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{ background: accentColor }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-700 mt-2 ml-1">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Prompts per agent ─────────────────────────────────────────────────

function getQuickPrompts(agentId: AgentId): string[] {
  const prompts: Record<AgentId, string[]> = {
    'product-manager': [
      'Write a user story for adding customer credit limits',
      'Prioritize: database vs real-time notifications',
      'Create acceptance criteria for the invoice module',
    ],
    'developer': [
      'How should I add persistent storage to this ERP?',
      'Write a custom React hook for API data fetching',
      'Explain the current server.ts architecture',
    ],
    'qa-engineer': [
      'What edge cases exist in the Quick Bill module?',
      'Write test cases for inventory stock updates',
      'Review the invoice creation flow for bugs',
    ],
    'release-manager': [
      'Create a release checklist for v1.0',
      'Write a changelog for the AI Team feature',
      'What should be in a rollback plan?',
    ],
    'tech-lead': [
      'Should we use SQLite or PostgreSQL for persistence?',
      'Review overall architecture and suggest improvements',
      'How to scale this ERP to multi-tenant?',
    ],
  };
  return prompts[agentId] || [];
}
