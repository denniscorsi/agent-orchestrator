const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parseInboxMessage } = require('../utils/parsing');

const router = express.Router();

router.get('/', async (req, res) => {
  const inboxDir = path.join(req.companyDir, 'shared', 'inbox');

  let files;
  try {
    files = await fs.readdir(inboxDir);
  } catch {
    return res.json([]);
  }

  const mdFiles = files.filter(f => f.endsWith('.md'));

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

module.exports = router;
