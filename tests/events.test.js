const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const createApp = require('../server/app');
const events = require('../server/routes/events');

let tmpDir;
let app;
let watcher;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));
  // Create the watched directories so chokidar doesn't error
  await fs.promises.mkdir(path.join(tmpDir, 'shared', 'reports'), { recursive: true });
  await fs.promises.mkdir(path.join(tmpDir, 'shared', 'inbox'), { recursive: true });
  app = createApp(tmpDir);
});

afterEach(async () => {
  // Clean up watcher if started
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
  // Clear all SSE clients between tests
  events.clients.clear();
  await fs.promises.rm(tmpDir, { recursive: true });
});

test('GET /events returns correct SSE headers', async () => {
  const res = await request(app)
    .get('/events')
    .buffer(false)
    .parse((res, callback) => {
      // Collect first chunk and abort
      res.on('data', (chunk) => {
        res.destroy();
        callback(null, chunk.toString());
      });
    });

  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toBe('text/event-stream');
  expect(res.headers['cache-control']).toBe('no-cache');
  expect(res.headers['connection']).toBe('keep-alive');
});

test('SSE broadcasts new-report event when a .md file is added to reports', (done) => {
  watcher = events.startWatcher(tmpDir);

  // Wait for watcher to be ready before creating files
  watcher.on('ready', () => {
    // Connect an SSE client using raw http to capture streamed data
    const http = require('http');
    const server = app.listen(0, () => {
      const port = server.address().port;
      const req = http.get(`http://127.0.0.1:${port}/events`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('"new-report"') && data.includes('\n\n')) {
            req.destroy();
            server.close();
            const lines = data.split('\n').filter((l) => l.startsWith('data: '));
            expect(lines.length).toBeGreaterThanOrEqual(1);
            const event = JSON.parse(lines[0].replace('data: ', ''));
            expect(event.type).toBe('new-report');
            expect(event.data.title).toBe('Test Report');
            expect(event.data.agent).toBe('CFO');
            done();
          }
        });
      });

      // Write a report file after a short delay
      setTimeout(() => {
        const reportContent = [
          '# Test Report',
          '',
          '**Author:** CFO',
          '**Date:** 2026-04-14',
          '',
          '---',
          '',
          'Report body content here.',
        ].join('\n');
        fs.promises.writeFile(
          path.join(tmpDir, 'shared', 'reports', 'test-report.md'),
          reportContent,
        );
      }, 300);
    });
  });
}, 15000);

test('SSE broadcasts new-message event when a .md file is added to inbox', (done) => {
  watcher = events.startWatcher(tmpDir);

  watcher.on('ready', () => {
    const http = require('http');
    const server = app.listen(0, () => {
      const port = server.address().port;
      const req = http.get(`http://127.0.0.1:${port}/events`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('"new-message"') && data.includes('\n\n')) {
            req.destroy();
            server.close();
            const lines = data.split('\n').filter((l) => l.startsWith('data: '));
            expect(lines.length).toBeGreaterThanOrEqual(1);
            const event = JSON.parse(lines[0].replace('data: ', ''));
            expect(event.type).toBe('new-message');
            expect(event.data.from).toBe('Market Researcher');
            expect(event.data.subject).toBe('Updated Data');
            done();
          }
        });
      });

      setTimeout(() => {
        const messageContent = [
          '# Message: Updated Data',
          '',
          '**To:** CFO',
          '**From:** Market Researcher',
          '**Date:** 2026-04-14',
          '**Re:** Updated Data',
          '',
          '---',
          '',
          'Here is the latest data.',
        ].join('\n');
        fs.promises.writeFile(
          path.join(tmpDir, 'shared', 'inbox', 'cfo-from-market-researcher-2026-04-14.md'),
          messageContent,
        );
      }, 300);
    });
  });
}, 15000);

test('SSE ignores non-.md files', (done) => {
  watcher = events.startWatcher(tmpDir);

  watcher.on('ready', () => {
    let receivedEvent = false;

    const http = require('http');
    const server = app.listen(0, () => {
      const port = server.address().port;
      const req = http.get(`http://127.0.0.1:${port}/events`, (res) => {
        res.on('data', (chunk) => {
          const text = chunk.toString();
          if (text.includes('data: ')) {
            receivedEvent = true;
          }
        });
      });

      // Write a non-.md file
      setTimeout(() => {
        fs.promises.writeFile(
          path.join(tmpDir, 'shared', 'reports', 'notes.txt'),
          'Not a markdown file',
        );
      }, 300);

      // Wait, then check no event was received
      setTimeout(() => {
        req.destroy();
        server.close();
        expect(receivedEvent).toBe(false);
        done();
      }, 2000);
    });
  });
}, 15000);
