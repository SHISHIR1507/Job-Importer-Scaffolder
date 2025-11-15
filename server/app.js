const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const importLogRoutes = require('./routes/importLogs');
require('./queues/jobWorker');
const { scheduleFeedImports } = require('./cron/jobFetcher');

const rootEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/import-logs', importLogRoutes);

function getInitialPort() {
  const envPort = parseInt(process.env.PORT || '5000', 10);
  return Number.isNaN(envPort) ? 5000 : envPort;
}

async function bindPort(port, retries = 5) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        logger.info('Server running', { port });
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE' && !process.env.PORT && retries > 0) {
          const nextPort = port + 1;
          logger.warn('Port in use, retrying on next port', { port, nextPort });
          setTimeout(() => {
            bindPort(nextPort, retries - 1).then(resolve).catch(reject);
          }, 250);
          return;
        }

        reject(err);
      });
  });
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected');

    scheduleFeedImports();

    await bindPort(getInitialPort());
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      logger.error('Failed to bind port', { err: err.message });
    } else {
      logger.error('Failed to start server', { err: err.message });
    }
    process.exit(1);
  }
}

start();
