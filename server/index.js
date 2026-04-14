const path = require('path');
const createApp = require('./app');

const companyDir = process.env.COMPANY_DIR || path.join(__dirname, '..', 'company');
const PORT = process.env.PORT || 4001;

const app = createApp(companyDir);

app.listen(PORT, () => {
  console.log(`Agent Dashboard backend running on http://localhost:${PORT}`);
});
