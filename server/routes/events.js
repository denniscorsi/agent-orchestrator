const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { parseReport, parseInboxMessage } = require('../utils/parsing');

// Track connected SSE clients
const clients = new Set();

function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}

function createRouter() {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n'); // flush headers

    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
  });

  return router;
}

function startWatcher(companyDir) {
  const reportsDir = path.join(companyDir, 'shared', 'reports');
  const inboxDir = path.join(companyDir, 'shared', 'inbox');

  const watcher = chokidar.watch([reportsDir, inboxDir], {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  watcher.on('add', async (filePath) => {
    if (!filePath.endsWith('.md')) return;

    const normalizedPath = path.normalize(filePath);
    const normalizedReports = path.normalize(reportsDir);
    const normalizedInbox = path.normalize(inboxDir);

    const isReport = normalizedPath.startsWith(normalizedReports);
    const isInbox = normalizedPath.startsWith(normalizedInbox);
    if (!isReport && !isInbox) return;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath);

      let event;
      if (isReport) {
        const parsed = parseReport(filename, content, stats);
        event = { type: 'new-report', data: parsed };
      } else {
        const parsed = parseInboxMessage(filename, content, stats);
        event = { type: 'new-message', data: parsed };
      }

      broadcast(event);
    } catch (err) {
      console.error('Error processing file change:', err);
    }
  });

  return watcher;
}

module.exports = { createRouter, startWatcher, broadcast, clients };
