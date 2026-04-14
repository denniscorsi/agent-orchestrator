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

async function createInboxDir() {
  const dir = path.join(tmpDir, 'shared', 'inbox');
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

test('GET /inbox returns empty array when inbox directory does not exist', async () => {
  const res = await request(app).get('/inbox');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('GET /inbox returns empty array when inbox directory is empty', async () => {
  await createInboxDir();
  const res = await request(app).get('/inbox');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('GET /inbox parses message metadata from content', async () => {
  const dir = await createInboxDir();
  await fs.promises.writeFile(
    path.join(dir, 'cfo-from-market-researcher-2026-04-10.md'),
    [
      '# Message: Updated Market Data',
      '',
      '**To:** CFO',
      '**From:** Market Researcher',
      '**Date:** 2026-04-10',
      '**Re:** Updated Market Data',
      '',
      '---',
      '',
      'Here is the latest market data for your models.',
    ].join('\n')
  );

  const res = await request(app).get('/inbox');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);

  const msg = res.body[0];
  expect(msg.to).toBe('CFO');
  expect(msg.from).toBe('Market Researcher');
  expect(msg.date).toBe('2026-04-10');
  expect(msg.subject).toBe('Updated Market Data');
  expect(msg.body).toContain('Here is the latest market data');
  expect(msg.archived).toBe(false);
});

test('GET /inbox falls back to filename parsing when metadata is missing', async () => {
  const dir = await createInboxDir();
  await fs.promises.writeFile(
    path.join(dir, 'dennis-from-cfo-2026-04-12.md'),
    'Just a plain message with no metadata headers.\n\nSome body text.'
  );

  const res = await request(app).get('/inbox');
  const msg = res.body[0];
  expect(msg.to).toBe('dennis');
  expect(msg.from).toBe('cfo');
});

test('GET /inbox sorts by date descending', async () => {
  const dir = await createInboxDir();
  await fs.promises.writeFile(
    path.join(dir, 'a-from-b-2026-01-01.md'),
    '**To:** A\n**From:** B\n**Date:** 2026-01-01\n**Re:** Old\n\n---\n\nOld message.'
  );
  await fs.promises.writeFile(
    path.join(dir, 'c-from-d-2026-06-01.md'),
    '**To:** C\n**From:** D\n**Date:** 2026-06-01\n**Re:** New\n\n---\n\nNew message.'
  );

  const res = await request(app).get('/inbox');
  expect(res.body).toHaveLength(2);
  expect(res.body[0].date).toBe('2026-06-01');
  expect(res.body[1].date).toBe('2026-01-01');
});

test('GET /inbox ignores non-markdown files', async () => {
  const dir = await createInboxDir();
  await fs.promises.writeFile(path.join(dir, 'notes.txt'), 'not a message');
  await fs.promises.writeFile(
    path.join(dir, 'cfo-from-dennis-2026-04-14.md'),
    '**To:** CFO\n**From:** Dennis\n**Date:** 2026-04-14\n**Re:** Task\n\n---\n\nPlease do this.'
  );

  const res = await request(app).get('/inbox');
  expect(res.body).toHaveLength(1);
});

// ---- POST /inbox tests ----

async function createCompanyMd(content) {
  await fs.promises.writeFile(path.join(tmpDir, 'COMPANY.md'), content);
}

const teamTable = [
  '## Team',
  '| Agent | Schedule | Role |',
  '|---|---|---|',
  '| **Market Researcher** | Weekly (Mondays 8am) | Competitive intelligence |',
  '| **CFO** | Weekly (Mondays 8am) | Revenue modeling |',
  '| **Partnerships Scout** | On-demand | Partner identification |',
].join('\n');

test('POST /inbox returns 400 when required fields are missing', async () => {
  const res = await request(app).post('/inbox').send({ to: 'cfo' });
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('Missing required fields');
});

test('POST /inbox creates a markdown file with correct format', async () => {
  await createInboxDir();
  await createCompanyMd(teamTable);

  const res = await request(app).post('/inbox').send({
    to: 'cfo',
    subject: 'Q2 Budget',
    message: 'Please prepare the Q2 budget review.',
  });
  expect(res.status).toBe(201);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].to).toBe('CFO');
  expect(res.body[0].from).toBe('Dennis');
  expect(res.body[0].subject).toBe('Q2 Budget');
  expect(res.body[0].body).toContain('Please prepare the Q2 budget review.');

  // Verify file was actually written
  const dir = path.join(tmpDir, 'shared', 'inbox');
  const files = await fs.promises.readdir(dir);
  const match = files.find((f) => f.startsWith('cfo-from-dennis-'));
  expect(match).toBeDefined();
});

test('POST /inbox handles date collision with counter suffix', async () => {
  const dir = await createInboxDir();
  const today = new Date().toISOString().split('T')[0];
  await fs.promises.writeFile(
    path.join(dir, `cfo-from-dennis-${today}.md`),
    'existing file'
  );

  await createCompanyMd(teamTable);

  const res = await request(app).post('/inbox').send({
    to: 'cfo',
    subject: 'Follow up',
    message: 'Second message today.',
  });
  expect(res.status).toBe(201);

  const files = await fs.promises.readdir(dir);
  const suffixed = files.find((f) => f.includes(`cfo-from-dennis-${today}-2.md`));
  expect(suffixed).toBeDefined();
});

test('POST /inbox broadcasts to all agents when to is "all"', async () => {
  await createInboxDir();
  await createCompanyMd(teamTable);

  const res = await request(app).post('/inbox').send({
    to: 'all',
    subject: 'Team Update',
    message: 'Hello everyone.',
  });
  expect(res.status).toBe(201);
  expect(res.body).toHaveLength(3);

  const recipients = res.body.map((m) => m.to).sort();
  expect(recipients).toEqual(['CFO', 'Market Researcher', 'Partnerships Scout']);

  const dir = path.join(tmpDir, 'shared', 'inbox');
  const files = await fs.promises.readdir(dir);
  expect(files).toHaveLength(3);
});

test('POST /inbox creates inbox directory if it does not exist', async () => {
  // Don't call createInboxDir — directory shouldn't exist yet
  await fs.promises.mkdir(path.join(tmpDir, 'shared'), { recursive: true });
  await createCompanyMd(teamTable);

  const res = await request(app).post('/inbox').send({
    to: 'cfo',
    subject: 'Hello',
    message: 'Test message.',
  });
  expect(res.status).toBe(201);

  const dir = path.join(tmpDir, 'shared', 'inbox');
  const files = await fs.promises.readdir(dir);
  expect(files).toHaveLength(1);
});

test('POST /inbox uses slug as display name when COMPANY.md is missing', async () => {
  await createInboxDir();
  // No COMPANY.md created

  const res = await request(app).post('/inbox').send({
    to: 'cfo',
    subject: 'Ping',
    message: 'Are you there?',
  });
  expect(res.status).toBe(201);
  expect(res.body[0].to).toBe('cfo');
});

test('GET /inbox extracts body after --- separator', async () => {
  const dir = await createInboxDir();
  await fs.promises.writeFile(
    path.join(dir, 'agent-from-dennis-2026-04-14.md'),
    [
      '# Message: Test',
      '',
      '**To:** Agent',
      '**From:** Dennis',
      '**Date:** 2026-04-14',
      '**Re:** Test',
      '',
      '---',
      '',
      'This is the actual body.',
      'It has multiple lines.',
    ].join('\n')
  );

  const res = await request(app).get('/inbox');
  expect(res.body[0].body).toBe('This is the actual body.\nIt has multiple lines.');
});
