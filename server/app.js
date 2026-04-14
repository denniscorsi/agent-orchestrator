const express = require('express');
const cors = require('cors');
const path = require('path');
const reportsRouter = require('./routes/reports');
const inboxRouter = require('./routes/inbox');
const agentsRouter = require('./routes/agents');
const events = require('./routes/events');

function createApp(companyDir) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    req.companyDir = companyDir;
    next();
  });

  app.use('/reports', reportsRouter);
  app.use('/inbox', inboxRouter);
  app.use('/agents', agentsRouter);
  app.use('/events', events.createRouter());

  // Serve frontend static files from client/dist
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA fallback: serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}

module.exports = createApp;
