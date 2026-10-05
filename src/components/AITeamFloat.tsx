/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Loader2, Minimize2, ChevronDown, AlertCircle } from 'lucide-react';
import type { AgentId, ChatMessage, GeminiHistoryEntry } from '../types/aiTeam';

// ─── Mini agent config ───────────────────────────────────────────────────────

interface AgentMeta {
  id: AgentId;
  shortName: string;
  emoji: string;
  color: string;
}

const FLOAT_AGENTS: AgentMeta[] = [
  { id: 'product-manager', shortName: 'Priya', emoji: '🧠', color: '#8B5CF6' },
  { id: 'developer',       shortName: 'Dev',   emoji: '💻', color: '#3B82F6' },
  { id: 'qa-engineer',     shortName: 'Quinn', emoji: '🔍', color: '#10B981' },
  { id: 'release-manager', shortName: 'Rex',   emoji: '🚀', color: '#F59E0B' },
  { id: 'tech-lead',       shortName: 'Zara',  emoji: '🎯', color: '#EF4444' },
  { id: 'security-engineer', shortName: 'Maya', emoji: '🛡️', color: '#EC4899' },
  { id: 'ui-ux-designer', shortName: 'Leo', emoji: '🎨', color: '#06B6D4' },
  { id: 'business-analyst', shortName: 'Rohan', emoji: '📊', color: '#84CC16' },
  { id: 'technical-writer', shortName: 'Kabir', emoji: '📝', color: '#94A3B8' },
  { id: 'growth-marketing-lead', shortName: 'Arjun', emoji: '📣', color: '#F97316' },
  { id: 'devops-sre-engineer', shortName: 'Vikram', emoji: '⚙️', color: '#14B8A6' },
  { id: 'legal-counsel', shortName: 'Meera', emoji: '⚖️', color: '#A855F7' },
];

const AGENT_BG: Record<AgentId, string> = {
  'product-manager': 'rgba(139,92,246,0.12)',
  'developer':       'rgba(59,130,246,0.12)',
  'qa-engineer':     'rgba(16,185,129,0.12)',
  'release-manager': 'rgba(245,158,11,0.12)',
  'tech-lead':       'rgba(239,68,68,0.12)',
  'security-engineer': 'rgba(236,72,153,0.12)',
  'ui-ux-designer': 'rgba(6,182,212,0.12)',
  'business-analyst': 'rgba(132,204,22,0.12)',
  'technical-writer': 'rgba(148,163,184,0.12)',
  'growth-marketing-lead': 'rgba(249,115,22,0.12)',
  'devops-sre-engineer': 'rgba(20,184,166,0.12)',
  'legal-counsel': 'rgba(168,85,247,0.12)',
};

// ─── Inline text renderer (same lightweight logic as AITeam.tsx) ─────────────

function renderSimple(text: string): string {
  // Strip markdown for compact display in float panel
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,3}\s/gm, '')
    .replace(/^[-*•]\s/gm, '• ');
}

// ─── Main Floating Panel ─────────────────────────────────────────────────────

export default function AITeamFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<AgentId>('developer');
  const [messages, setMessages] = useState<Record<AgentId, ChatMessage[]>>({} as Record<AgentId, ChatMessage[]>);
  const [history, setHistory] = useState<Record<AgentId, GeminiHistoryEntry[]>>({} as Record<AgentId, GeminiHistoryEntry[]>);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAgent = FLOAT_AGENTS.find(a => a.id === selectedId)!;
  const currentMessages = messages[selectedId] || [];

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, selectedId]);

  // Close agent picker when clicking outside
  useEffect(() => {
    const handleClick = () => setShowAgentPicker(false);
    if (showAgentPicker) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showAgentPicker]);

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

    setMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsg],
    }));

    try {
      const res = await fetch('/api/ai-team/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedId,
          message: trimmed,
          history: history[selectedId] || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const aiMsg: ChatMessage = {
        id: `${Date.now()}-model`,
        role: 'model',
        text: data.response,
        agentId: selectedId,
        timestamp: new Date(),
      };

      setMessages(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), aiMsg],
      }));
      setHistory(prev => ({
        ...prev,
        [selectedId]: [
          ...(prev[selectedId] || []),
          { role: 'user', parts: [{ text: trimmed }] },
          { role: 'model', parts: [{ text: data.response }] },
        ],
      }));
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setMessages(prev => ({
        ...prev,
        [selectedId]: (prev[selectedId] || []).slice(0, -1),
      }));
    }

    setIsLoading(false);
  }, [input, isLoading, selectedId, history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
    if (e.key === 'Escape') setIsOpen(false);
  };

  // Unread count across all agents
  const totalMsgs = (Object.values(messages) as ChatMessage[][]).reduce((s, msgs) => s + (msgs || []).length, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="float-panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-80 bg-[#0D0D0D] border border-white/10 rounded-[24px] shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            style={{ maxHeight: '480px' }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-white/5"
              style={{ background: AGENT_BG[selectedId] }}
            >
              {/* Agent Picker */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAgentPicker(v => !v); }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                    style={{ background: `${selectedAgent.color}30` }}
                  >
                    {selectedAgent.emoji}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-none">{selectedAgent.shortName}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">AI Agent</p>
                  </div>
                  <ChevronDown size={12} className={`text-gray-500 transition-transform ${showAgentPicker ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAgentPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-2 bg-[#111111] border border-white/10 rounded-2xl p-1.5 shadow-xl z-10 w-44"
                      onClick={e => e.stopPropagation()}
                    >
                      {FLOAT_AGENTS.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => { setSelectedId(agent.id); setShowAgentPicker(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs ${
                            selectedId === agent.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{agent.emoji}</span>
                          <span className="font-medium">{agent.shortName}</span>
                          {selectedId === agent.id && (
                            <div className="w-1 h-1 rounded-full ml-auto shrink-0" style={{ background: agent.color }} />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Minimize2 size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Agent pills row */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5">
              {FLOAT_AGENTS.map(a => {
                const msgCount = (messages[a.id] || []).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    title={a.shortName}
                    className={`relative w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                      selectedId === a.id ? 'ring-1 scale-110' : 'opacity-40 hover:opacity-80'
                    }`}
                    style={
                      selectedId === a.id
                        ? { background: `${a.color}25`, ringColor: a.color }
                        : { background: 'transparent' }
                    }
                  >
                    {a.emoji}
                    {msgCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full text-[7px] font-black flex items-center justify-center" style={{ background: a.color }}>
                        {Math.ceil(msgCount / 2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '200px', maxHeight: '280px' }}>
              {currentMessages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <span className="text-3xl mb-3">{selectedAgent.emoji}</span>
                  <p className="text-xs text-gray-500">
                    Hi! I'm <strong className="text-gray-400">{selectedAgent.shortName}</strong>. What can I help you with?
                  </p>
                </div>
              )}

              {currentMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5"
                        style={{ background: `${selectedAgent.color}25` }}
                      >
                        {selectedAgent.emoji}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'rounded-bl-sm text-gray-300'
                      }`}
                      style={
                        !isUser
                          ? { background: AGENT_BG[selectedId], border: `1px solid ${selectedAgent.color}25` }
                          : {}
                      }
                    >
                      {isUser ? msg.text : renderSimple(msg.text)}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                    style={{ background: `${selectedAgent.color}25` }}
                  >
                    {selectedAgent.emoji}
                  </div>
                  <div
                    className="px-3 py-2 rounded-xl rounded-bl-sm"
                    style={{ background: AGENT_BG[selectedId], color: selectedAgent.color }}
                  >
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="flex items-center gap-1.5 p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-medium">
                  <AlertCircle size={11} className="shrink-0" />
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${selectedAgent.shortName}…`}
                  className="flex-1 bg-[#111111] border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/30 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: selectedAgent.color }}
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/40 relative"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #1a1a1a, #0d0d0d)'
            : 'linear-gradient(135deg, #2563EB, #1d4ed8)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        title="AI Dev Team"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} className="text-gray-400" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot size={24} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!isOpen && totalMsgs > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 border-black"
          >
            {Math.min(totalMsgs / 2, 9)}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
