import { getAgentColor, accentClasses } from '../agentColors';

describe('getAgentColor', () => {
  it('returns blue for market-researcher', () => {
    expect(getAgentColor('market-researcher')).toBe('blue');
  });

  it('returns amber for cfo', () => {
    expect(getAgentColor('cfo')).toBe('amber');
  });

  it('returns teal for partnerships-scout', () => {
    expect(getAgentColor('partnerships-scout')).toBe('teal');
  });

  it('returns blue as default for unknown agents', () => {
    expect(getAgentColor('unknown-agent')).toBe('blue');
  });
});

describe('accentClasses', () => {
  it('has entries for all three colors', () => {
    expect(accentClasses).toHaveProperty('blue');
    expect(accentClasses).toHaveProperty('amber');
    expect(accentClasses).toHaveProperty('teal');
  });

  it('each color has border, bg, text, and badge classes', () => {
    for (const color of ['blue', 'amber', 'teal'] as const) {
      const classes = accentClasses[color];
      expect(classes.border).toBeDefined();
      expect(classes.bg).toBeDefined();
      expect(classes.text).toBeDefined();
      expect(classes.badge).toBeDefined();
    }
  });
});
