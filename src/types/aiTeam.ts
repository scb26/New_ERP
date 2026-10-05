/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentId =
  | 'product-manager'
  | 'developer'
  | 'qa-engineer'
  | 'release-manager'
  | 'tech-lead'
  | 'security-engineer'
  | 'ui-ux-designer'
  | 'business-analyst'
  | 'technical-writer'
  | 'growth-marketing-lead'
  | 'devops-sre-engineer'
  | 'legal-counsel';

export interface Agent {
  id: AgentId;
  name: string;
  shortName: string;
  role: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  status: 'active' | 'thinking' | 'idle';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  agentId?: AgentId;
  timestamp: Date;
}

export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export type ConversationMap = Record<AgentId, ChatMessage[]>;
export type HistoryMap = Record<AgentId, GeminiHistoryEntry[]>;
