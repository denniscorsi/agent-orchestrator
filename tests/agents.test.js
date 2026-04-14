const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const createApp = require('../server/app');

let tmpDir;
let app;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));
  app = createApp(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true });
});

async function setupAgents() {
  // Create agents directories
  await fs.promises.mkdir(path.join(tmpDir, 'agents', 'market-researcher'), { recursive: true });
  await fs.promises.mkdir(path.join(tmpDir, 'agents', 'cfo'), { recursive: true });
  await fs.promises.mkdir(path.join(tmpDir, 'agents', 'partnerships-scout'), { recursive: true });

  // Create memory files
  await fs.promises.writeFile(
    path.join(tmpDir, 'agents', 'market-researcher', 'memory.md'),
    '# Market Researcher Memory\n\nRemember: focus on RWA market.'
  );
  await fs.promises.writeFile(
    path.join(tmpDir, 'agents', 'cfo', 'memory.md'),
    '# CFO Memory\n\nRemember: runway through November.'
  );
  await fs.promises.writeFile(
    path.join(tmpDir, 'agents', 'partnerships-scout', 'memory.md'),
    '# Partnerships Scout Memory\n\nRemember: ChainBridge is top priority.'
  );

  // Create COMPANY.md with team table
  await fs.promises.writeFile(
    path.join(tmpDir, 'COMPANY.md'),
    [
      '# Company Handbook',
      '',
      '## Team',
      '',
      '| Agent | Schedule | Role |',
      '|---|---|---|',
      '| **Market Researcher** | Weekly (Mondays 8am) | Competitive intelligence and trends |',
      '| **CFO** | Weekly (Mondays 8am) | Revenue modeling and cost tracking |',
      '| **Partnerships Scout** | On-demand | Partnership opportunity identification |',
    ].join('\n')
  );
}

test('GET /agents returns empty array when agents directory does not exist', async () => {
  const res = await request(app).get('/agents');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('GET /agents returns agent list with metadata from COMPANY.md', async () => {
  await setupAgents();

  const res = await request(app).get('/agents');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(3);

  const names = res.body.map(a => a.name).sort();
  expect(names).toEqual(['CFO', 'Market Researcher', 'Partnerships Scout']);

  const mr = res.body.find(a => a.id === 'market-researcher');
  expect(mr.name).toBe('Market Researcher');
  expect(mr.role).toBe('Competitive intelligence and trends');
  expect(mr.schedule).toBe('Weekly (Mondays 8am)');
  expect(mr.lastRunTime).toBeTruthy();

  const cfo = res.body.find(a => a.id === 'cfo');
  expect(cfo.name).toBe('CFO');
  expect(cfo.schedule).toBe('Weekly (Mondays 8am)');

  const ps = res.body.find(a => a.id === 'partnerships-scout');
  expect(ps.name).toBe('Partnerships Scout');
  expect(ps.schedule).toBe('On-demand');
});

test('GET /agents returns agents even without COMPANY.md', async () => {
  await fs.promises.mkdir(path.join(tmpDir, 'agents', 'my-agent'), { recursive: true });
  await fs.promises.writeFile(
    path.join(tmpDir, 'agents', 'my-agent', 'memory.md'),
    'some content'
  );

  const res = await request(app).get('/agents');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].id).toBe('my-agent');
  expect(res.body[0].name).toBe('my-agent');
  expect(res.body[0].role).toBe('Unknown');
  expect(res.body[0].schedule).toBe('Unknown');
});

test('GET /agents includes lastRunTime from file modification time', async () => {
  await setupAgents();

  const res = await request(app).get('/agents');
  const mr = res.body.find(a => a.id === 'market-researcher');
  // lastRunTime should be a valid ISO date string
  expect(new Date(mr.lastRunTime).toISOString()).toBe(mr.lastRunTime);
});

test('GET /agents/:id/memory returns memory file content', async () => {
  await setupAgents();

  const res = await request(app).get('/agents/market-researcher/memory');
  expect(res.status).toBe(200);
  expect(res.body.content).toContain('# Market Researcher Memory');
  expect(res.body.content).toContain('focus on RWA market');
});

test('GET /agents/:id/memory returns 404 for unknown agent', async () => {
  const res = await request(app).get('/agents/nonexistent/memory');
  expect(res.status).toBe(404);
  expect(res.body.error).toBeTruthy();
});

test('GET /agents/:id/memory returns 404 when agent dir exists but no memory.md', async () => {
  await fs.promises.mkdir(path.join(tmpDir, 'agents', 'no-memory'), { recursive: true });

  const res = await request(app).get('/agents/no-memory/memory');
  expect(res.status).toBe(404);
});

test('GET /agents/:id/memory returns correct content for each agent', async () => {
  await setupAgents();

  const cfoRes = await request(app).get('/agents/cfo/memory');
  expect(cfoRes.body.content).toContain('runway through November');

  const psRes = await request(app).get('/agents/partnerships-scout/memory');
  expect(psRes.body.content).toContain('ChainBridge is top priority');
});

test('POST /agents/:id/run returns 404 when agent does not exist', async () => {
  const res = await request(app).post('/agents/nonexistent/run');
  expect(res.status).toBe(404);
  expect(res.body.error).toContain('nonexistent');
});

test('POST /agents/:id/run returns 502 when Cowork API is unreachable', async () => {
  await setupAgents();

  // Default COWORK_API_URL (localhost:3000) won't be running in tests
  const res = await request(app).post('/agents/market-researcher/run');
  expect(res.status).toBe(502);
  expect(res.body.error).toBe('Could not reach Cowork API');
  expect(res.body.detail).toBeTruthy();
});

test('POST /agents/:id/run proxies to Cowork API and returns success', async () => {
  await setupAgents();

  // Mock global fetch to simulate a successful Cowork API response
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ status: 'triggered', taskId: 'market-researcher' }),
  });

  try {
    const res = await request(app).post('/agents/market-researcher/run');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('triggered');
    expect(res.body.agentId).toBe('market-researcher');
    expect(res.body.cowork).toEqual({ status: 'triggered', taskId: 'market-researcher' });

    // Verify fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/triggers/market-researcher/run'),
      expect.objectContaining({ method: 'POST' })
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /agents/:id/run returns 502 when Cowork API returns an error', async () => {
  await setupAgents();

  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: () => Promise.resolve('Internal Server Error'),
  });

  try {
    const res = await request(app).post('/agents/market-researcher/run');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Cowork API returned an error');
    expect(res.body.status).toBe(500);
    expect(res.body.detail).toBe('Internal Server Error');
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /agents/:id/run uses COWORK_API_URL environment variable', async () => {
  await setupAgents();

  const originalFetch = global.fetch;
  const originalEnv = process.env.COWORK_API_URL;
  process.env.COWORK_API_URL = 'http://custom-cowork:8080';

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ status: 'triggered', taskId: 'cfo' }),
  });

  try {
    await request(app).post('/agents/cfo/run');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://custom-cowork:8080/api/triggers/cfo/run',
      expect.any(Object)
    );
  } finally {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.COWORK_API_URL;
    } else {
      process.env.COWORK_API_URL = originalEnv;
    }
  }
});
