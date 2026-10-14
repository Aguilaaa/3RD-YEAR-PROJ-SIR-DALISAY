require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { firebaseConfigured } = require('./config/firebase');
const { cloudinaryConfigured } = require('./config/cloudinary');
const { emailConfigured } = require('./utils/email');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { seedReferenceData } = require('./seed');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'MotoTech API',
    firebase: firebaseConfigured(),
    cloudinary: cloudinaryConfigured(),
    email: emailConfigured(),
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

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
