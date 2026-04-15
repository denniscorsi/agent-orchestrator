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
 * POST /agents/:id/run — trigger an agent run via the Claude Routines API.
 *
 * Routines API:
 *   POST https://api.anthropic.com/v1/claude_code/routines/{triggerId}/fire
 *   Headers: Authorization: Bearer {token}, anthropic-beta, anthropic-version
 *   Response: { type: "routine_fire", claude_code_session_id, claude_code_session_url }
 *
 * Credentials are stored per-agent in routines.json (gitignored).
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

  // Load routine config for this agent
  const routinesPath = path.join(__dirname, '..', '..', 'routines.json');
  let routineConfig;
  try {
    const raw = await fs.readFile(routinesPath, 'utf-8');
    const routines = JSON.parse(raw);
    routineConfig = routines[agentId];
  } catch {
    return res.status(500).json({
      error: 'Could not read routines.json config',
    });
  }

  if (!routineConfig || !routineConfig.triggerId || !routineConfig.token) {
    return res.status(422).json({
      error: `No routine configured for agent '${agentId}'`,
      detail: 'Add triggerId and token to routines.json. See routines.example.json.',
    });
  }

  const triggerUrl = `https://api.anthropic.com/v1/claude_code/routines/${routineConfig.triggerId}/fire`;

  try {
    const response = await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${routineConfig.token}`,
        'Content-Type': 'application/json',
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({
        error: 'Routines API returned an error',
        status: response.status,
        detail: body,
      });
    }

    const data = await response.json();
    res.json({
      status: 'triggered',
      agentId,
      sessionId: data.claude_code_session_id,
      sessionUrl: data.claude_code_session_url,
    });
  } catch (err) {
    res.status(502).json({
      error: 'Could not reach Routines API',
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
