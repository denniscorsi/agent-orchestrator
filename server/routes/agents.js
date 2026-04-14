const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parseTeamTable, slugify } = require('../utils/parsing');

const router = express.Router();

/**
 * Get the most recent modification time of any file in a directory (non-recursive).
 */
async function getLastRunTime(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    let latest = null;
    for (const entry of entries) {
      const stats = await fs.stat(path.join(dirPath, entry));
      if (!latest || stats.mtime > latest) {
        latest = stats.mtime;
      }
    }
    return latest ? latest.toISOString() : null;
  } catch {
    return null;
  }
}

/**
 * GET /agents — list all agents with metadata from COMPANY.md and filesystem.
 */
router.get('/', async (req, res) => {
  const agentsDir = path.join(req.companyDir, 'agents');
  const companyMdPath = path.join(req.companyDir, 'COMPANY.md');

  // Read agent directories
  let dirEntries;
  try {
    dirEntries = await fs.readdir(agentsDir, { withFileTypes: true });
  } catch {
    return res.json([]);
  }

  const agentDirs = dirEntries.filter(d => d.isDirectory()).map(d => d.name);

  // Parse COMPANY.md for metadata
  let teamData = [];
  try {
    const companyContent = await fs.readFile(companyMdPath, 'utf-8');
    teamData = parseTeamTable(companyContent);
  } catch {
    // COMPANY.md not found — continue with directory info only
  }

  const teamBySlug = {};
  for (const entry of teamData) {
    teamBySlug[entry.slug] = entry;
  }

  const agents = await Promise.all(
    agentDirs.map(async (dirName) => {
      const teamEntry = teamBySlug[dirName];
      const lastRunTime = await getLastRunTime(path.join(agentsDir, dirName));
      return {
        id: dirName,
        name: teamEntry ? teamEntry.name : dirName,
        role: teamEntry ? teamEntry.role : 'Unknown',
        schedule: teamEntry ? teamEntry.schedule : 'Unknown',
        lastRunTime,
      };
    })
  );

  res.json(agents);
});

/**
 * GET /agents/:id/memory — return the agent's memory.md content.
 */
router.get('/:id/memory', async (req, res) => {
  const memoryPath = path.join(req.companyDir, 'agents', req.params.id, 'memory.md');

  try {
    const content = await fs.readFile(memoryPath, 'utf-8');
    res.json({ content });
  } catch {
    res.status(404).json({ error: 'Agent memory file not found' });
  }
});

module.exports = router;
