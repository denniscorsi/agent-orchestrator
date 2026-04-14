export interface Agent {
  id: string;
  name: string;
  role: string;
  schedule: string;
  lastRunTime: string | null;
  status?: 'idle' | 'running' | 'needs attention';
}

export type AgentColor = 'blue' | 'amber' | 'teal';

export interface Report {
  filename: string;
  title: string;
  agent: string;
  date: string;
  summary: string;
  content: string;
}

export interface InboxMessage {
  to: string;
  from: string;
  date: string;
  subject: string;
  body: string;
  archived: boolean;
}
