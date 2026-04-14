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
