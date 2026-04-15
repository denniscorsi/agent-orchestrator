const path = require('path');
const createApp = require('./app');
const events = require('./routes/events');

const companyDir = process.env.COMPANY_DIR || '/Users/denniscorsi/Documents/Claude/Projects/Tether/company';
const PORT = process.env.PORT || 4001;

const app = createApp(companyDir);

const watcher = events.startWatcher(companyDir);

app.listen(PORT, () => {
  console.log(`Agent Dashboard backend running on http://localhost:${PORT}`);
});
