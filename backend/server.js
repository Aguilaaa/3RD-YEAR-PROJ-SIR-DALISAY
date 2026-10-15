const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedReferenceData } = require('./seed');

const port = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedReferenceData();
    app.listen(port, () => {
      console.log(`MotoTech API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start MotoTech API:', error.message);
    process.exit(1);
  });
