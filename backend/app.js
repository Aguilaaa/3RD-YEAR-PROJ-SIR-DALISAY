const express = require('express');
const cors = require('cors');
const { firebaseConfigured } = require('./config/firebase');
const { cloudinaryConfigured } = require('./config/cloudinary');
const { emailConfigured } = require('./utils/email');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
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

module.exports = app;
