const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parseReport } = require('../utils/parsing');

const router = express.Router();

router.get('/', async (req, res) => {
  const reportsDir = path.join(req.companyDir, 'shared', 'reports');

  let files;
  try {
    files = await fs.readdir(reportsDir);
  } catch {
    return res.json([]);
  }

  const mdFiles = files.filter(f => f.endsWith('.md'));

  const reports = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(reportsDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      return parseReport(filename, content, stats);
    })
  );

  reports.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(reports);
});

module.exports = router;
