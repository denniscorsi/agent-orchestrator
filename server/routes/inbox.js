const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parseInboxMessage, parseTeamTable, slugify } = require('../utils/parsing');

const router = express.Router();

router.get('/', async (req, res) => {
  const inboxDir = path.join(req.companyDir, 'shared', 'inbox');

  let files;
  try {
    files = await fs.readdir(inboxDir);
  } catch {
    return res.json([]);
  }

  const mdFiles = files.filter(f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

  const messages = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(inboxDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      return parseInboxMessage(filename, content, stats);
    })
  );

  messages.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(messages);
});

/**
 * Generate a unique filename, appending a counter suffix on collision.
 * e.g. cfo-from-dennis-2026-04-14.md -> cfo-from-dennis-2026-04-14-2.md
 */
async function uniqueFilename(dir, base) {
  const candidate = `${base}.md`;
  try {
    await fs.access(path.join(dir, candidate));
  } catch {
    return candidate;
  }
  let counter = 2;
  while (true) {
    const name = `${base}-${counter}.md`;
    try {
      await fs.access(path.join(dir, name));
    } catch {
      return name;
    }
    counter++;
  }
}

function buildMessageContent(to, subject, body, date) {
  return [
    `# Message: ${subject}`,
    '',
    `**To:** ${to}`,
    '**From:** Dennis',
    `**Date:** ${date}`,
    `**Re:** ${subject}`,
    '',
    '---',
    '',
    body,
  ].join('\n');
}

/**
 * POST /inbox — write a new message to the inbox.
 * Body: { to: string (agent slug or "all"), subject: string, message: string }
 */
router.post('/', async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
  }

  const inboxDir = path.join(req.companyDir, 'shared', 'inbox');
  await fs.mkdir(inboxDir, { recursive: true });

  const today = new Date().toISOString().split('T')[0];

  // Determine recipients
  let recipients;
  if (to === 'all') {
    const companyMdPath = path.join(req.companyDir, 'COMPANY.md');
    try {
      const companyContent = await fs.readFile(companyMdPath, 'utf-8');
      const team = parseTeamTable(companyContent);
      recipients = team.map((a) => ({ slug: a.slug, name: a.name }));
    } catch {
      return res.status(500).json({ error: 'Could not read agent list from COMPANY.md' });
    }
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No agents found in COMPANY.md' });
    }
  } else {
    // to is a slug; resolve display name from COMPANY.md if possible
    let displayName = to;
    try {
      const companyContent = await fs.readFile(path.join(req.companyDir, 'COMPANY.md'), 'utf-8');
      const team = parseTeamTable(companyContent);
      const match = team.find((a) => a.slug === to);
      if (match) displayName = match.name;
    } catch {
      // Use slug as-is
    }
    recipients = [{ slug: to, name: displayName }];
  }

  const created = [];
  for (const recipient of recipients) {
    const base = `${recipient.slug}-from-dennis-${today}`;
    const filename = await uniqueFilename(inboxDir, base);
    const content = buildMessageContent(recipient.name, subject, message, today);
    await fs.writeFile(path.join(inboxDir, filename), content);
    const stats = await fs.stat(path.join(inboxDir, filename));
    created.push(parseInboxMessage(filename, content, stats));
  }

  res.status(201).json(created);
});

module.exports = router;
