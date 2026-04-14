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
 * POST /agents/:id/run — trigger an agent run via the Cowork API.
 *
 * Cowork API contract (assumed, pending confirmation):
 *   POST {COWORK_API_URL}/api/triggers/{taskId}/run
 *   Request: { agentId: string }
 *   Response: { status: 'triggered', taskId: string }
 *
 * Environment variables:
 *   COWORK_API_URL — Base URL for the Cowork service (default: http://localhost:3000)
 */
router.post('/:id/run', async (req, res) => {
  const agentId = req.params.id;

  // Verify agent exists
  const agentDir = path.join(req.companyDir, 'agents', agentId);
  try {
    await fs.access(agentDir);
  } catch {
    return res.status(404).json({ error: `Agent '${agentId}' not found` });
  }

  const coworkUrl = process.env.COWORK_API_URL || 'http://localhost:3000';
  const triggerUrl = `${coworkUrl}/api/triggers/${agentId}/run`;

  try {
    const response = await fetch(triggerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({
        error: 'Cowork API returned an error',
        status: response.status,
        detail: body,
      });
    }

    const data = await response.json();
    res.json({ status: 'triggered', agentId, cowork: data });
  } catch (err) {
    res.status(502).json({
      error: 'Could not reach Cowork API',
      detail: err.message,
    });
  }
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
