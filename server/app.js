const express = require('express');
const cors = require('cors');
const path = require('path');
const reportsRouter = require('./routes/reports');
const inboxRouter = require('./routes/inbox');
const agentsRouter = require('./routes/agents');

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

  return app;
}

module.exports = createApp;
