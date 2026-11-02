// src/types/index.ts

export type AppState = 'lobby' | 'interviewing' | 'finished';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface TranscriptMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}
