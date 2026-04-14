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
