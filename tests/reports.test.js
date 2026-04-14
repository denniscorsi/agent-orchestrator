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

async function createReportsDir() {
  const dir = path.join(tmpDir, 'shared', 'reports');
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

test('GET /reports returns empty array when reports directory does not exist', async () => {
  const res = await request(app).get('/reports');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('GET /reports returns empty array when reports directory is empty', async () => {
  await createReportsDir();
  const res = await request(app).get('/reports');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('GET /reports returns report with metadata parsed from content', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(
    path.join(dir, 'test-report.md'),
    [
      '# Weekly Market Update',
      '',
      '**Author:** Market Researcher',
      '**Date:** 2026-04-01',
      '',
      '---',
      '',
      'The market showed strong growth this quarter. Revenue increased by 20% across all segments. New partnerships drove additional deal flow.',
      '',
      '## Details',
      '',
      'More detailed analysis here.',
    ].join('\n')
  );

  const res = await request(app).get('/reports');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);

  const report = res.body[0];
  expect(report.title).toBe('Weekly Market Update');
  expect(report.agent).toBe('Market Researcher');
  expect(report.date).toBe('2026-04-01');
  expect(report.summary).toContain('The market showed strong growth');
  expect(report.content).toContain('# Weekly Market Update');
});

test('GET /reports falls back to filename for title when no H1', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(
    path.join(dir, 'my-report.md'),
    '**Author:** CFO\n**Date:** 2026-03-15\n\n---\n\nSome content here.'
  );

  const res = await request(app).get('/reports');
  expect(res.body[0].title).toBe('my-report');
});

test('GET /reports falls back to Unknown agent when no Author metadata', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(
    path.join(dir, 'report.md'),
    '# A Report\n\n---\n\nContent without author.'
  );

  const res = await request(app).get('/reports');
  expect(res.body[0].agent).toBe('Unknown');
});

test('GET /reports sorts by date descending', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(
    path.join(dir, 'older.md'),
    '# Older\n\n**Author:** CFO\n**Date:** 2026-01-01\n\n---\n\nOld report.'
  );
  await fs.promises.writeFile(
    path.join(dir, 'newer.md'),
    '# Newer\n\n**Author:** CFO\n**Date:** 2026-06-01\n\n---\n\nNew report.'
  );

  const res = await request(app).get('/reports');
  expect(res.body).toHaveLength(2);
  expect(res.body[0].title).toBe('Newer');
  expect(res.body[1].title).toBe('Older');
});

test('GET /reports ignores non-markdown files', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(path.join(dir, 'notes.txt'), 'not a report');
  await fs.promises.writeFile(
    path.join(dir, 'report.md'),
    '# Real Report\n\n**Author:** CFO\n**Date:** 2026-04-01\n\n---\n\nContent.'
  );

  const res = await request(app).get('/reports');
  expect(res.body).toHaveLength(1);
  expect(res.body[0].title).toBe('Real Report');
});

test('GET /reports extracts summary of up to 5 sentences', async () => {
  const dir = await createReportsDir();
  await fs.promises.writeFile(
    path.join(dir, 'long.md'),
    [
      '# Long Report',
      '',
      '**Author:** CFO',
      '**Date:** 2026-04-01',
      '',
      '---',
      '',
      'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six. Sentence seven.',
    ].join('\n')
  );

  const res = await request(app).get('/reports');
  const summary = res.body[0].summary;
  // Should contain at most 5 sentences
  const sentenceCount = (summary.match(/\./g) || []).length;
  expect(sentenceCount).toBeLessThanOrEqual(5);
  expect(summary).toContain('Sentence one.');
  expect(summary).not.toContain('Sentence six.');
});
