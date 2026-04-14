import type { AgentColor } from './types';

const colorMap: Record<string, AgentColor> = {
  'market-researcher': 'blue',
  'cfo': 'amber',
  'partnerships-scout': 'teal',
};

export function getAgentColor(agentId: string): AgentColor {
  return colorMap[agentId] ?? 'blue';
}

export const accentClasses: Record<AgentColor, { border: string; bg: string; text: string; badge: string }> = {
  blue: {
    border: 'border-agent-blue/40',
    bg: 'bg-agent-blue/10',
    text: 'text-agent-blue',
    badge: 'bg-agent-blue/20 text-agent-blue',
  },
  amber: {
    border: 'border-agent-amber/40',
    bg: 'bg-agent-amber/10',
    text: 'text-agent-amber',
    badge: 'bg-agent-amber/20 text-agent-amber',
  },
  teal: {
    border: 'border-agent-teal/40',
    bg: 'bg-agent-teal/10',
    text: 'text-agent-teal',
    badge: 'bg-agent-teal/20 text-agent-teal',
  },
};
