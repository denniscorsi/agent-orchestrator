const path = require('path');

/**
 * Extract a metadata value like **Key:** value from markdown content.
 */
function extractMetadata(content, key) {
  const regex = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract the first H1 heading from markdown content.
 */
function extractTitle(content, filename) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return filename.replace(/\.md$/, '');
}

/**
 * Extract a summary (first 3-5 sentences) from the body after the --- separator.
 */
function extractSummary(content) {
  const parts = content.split(/\n---\n/);
  const body = parts.length > 1 ? parts.slice(1).join('\n---\n').trim() : '';
  if (!body) return '';

  // Match sentences ending with . ! or ?
  const sentences = body.match(/[^.!?\n][^.!?]*[.!?]+/g);
  if (!sentences) return body.substring(0, 500);
  return sentences.slice(0, 5).join(' ').trim();
}

/**
 * Parse a report markdown file into a structured object.
 */
function parseReport(filename, content, stats) {
  return {
    filename,
    title: extractTitle(content, filename),
    agent: extractMetadata(content, 'Author') || extractMetadata(content, 'Agent') || 'Unknown',
    date: extractMetadata(content, 'Date') || stats.mtime.toISOString().split('T')[0],
    summary: extractSummary(content),
    content,
  };
}

/**
 * Parse an inbox markdown file into a structured object.
 */
function parseInboxMessage(filename, content, stats) {
  return {
    to: extractMetadata(content, 'To') || parseFilenameRecipient(filename),
    from: extractMetadata(content, 'From') || parseFilenameSender(filename),
    date: extractMetadata(content, 'Date') || stats.mtime.toISOString().split('T')[0],
    subject: extractMetadata(content, 'Re') || extractTitle(content, filename),
    body: extractBody(content),
    archived: false,
  };
}

/**
 * Extract the body text after the --- separator.
 */
function extractBody(content) {
  const parts = content.split(/\n---\n/);
  return parts.length > 1 ? parts.slice(1).join('\n---\n').trim() : content;
}

/**
 * Parse recipient from inbox filename convention: {recipient}-from-{sender}-{date}.md
 */
function parseFilenameRecipient(filename) {
  const match = filename.match(/^(.+?)-from-/);
  return match ? match[1] : 'Unknown';
}

/**
 * Parse sender from inbox filename convention: {recipient}-from-{sender}-{date}.md
 */
function parseFilenameSender(filename) {
  const match = filename.match(/-from-(.+?)-\d{4}-\d{2}-\d{2}/);
  return match ? match[1] : 'Unknown';
}

/**
 * Parse the team table from COMPANY.md content.
 * Returns an array of { name, role, schedule, slug }.
 *
 * Detects column order from the header row so it works regardless of
 * whether the table is Agent|Schedule|Role or Agent|Role|Schedule|…
 */
function parseTeamTable(content) {
  const lines = content.split('\n');
  const agents = [];

  let inTable = false;
  let headerPassed = false;
  let columnMap = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      if (inTable) break; // end of table
      continue;
    }

    // Detect the team table by looking for Agent header
    if (!inTable) {
      if (/\|\s*Agent\s*\|/i.test(trimmed)) {
        inTable = true;
        // Build column index from header cells
        const headers = trimmed
          .split('|')
          .map(c => c.trim().toLowerCase())
          .filter(c => c.length > 0);
        headers.forEach((h, i) => { columnMap[h] = i; });
        continue;
      }
      continue;
    }

    // Skip separator row (|---|---|---|)
    if (/^\|[\s\-|]+\|$/.test(trimmed)) {
      headerPassed = true;
      continue;
    }

    if (!headerPassed) continue;

    const cells = trimmed
      .split('|')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (cells.length >= 3) {
      const nameIdx = columnMap['agent'] ?? 0;
      const roleIdx = columnMap['role'] ?? 1;
      const scheduleIdx = columnMap['schedule'] ?? 2;

      const name = (cells[nameIdx] || '').replace(/\*\*/g, '').trim();
      const role = (cells[roleIdx] || '').trim();
      const schedule = (cells[scheduleIdx] || '').trim();
      agents.push({
        name,
        role,
        schedule,
        slug: slugify(name),
      });
    }
  }

  return agents;
}

/**
 * Slugify a name: "Market Researcher" -> "market-researcher"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = {
  extractMetadata,
  extractTitle,
  extractSummary,
  extractBody,
  parseReport,
  parseInboxMessage,
  parseFilenameRecipient,
  parseFilenameSender,
  parseTeamTable,
  slugify,
};
