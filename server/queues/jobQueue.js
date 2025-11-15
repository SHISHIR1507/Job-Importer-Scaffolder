const { Queue } = require('bullmq');
const logger = require('../utils/logger');

const connection = { connection: { url: process.env.REDIS_URL } };

const jobQueue = new Queue('job-import-queue', connection);

jobQueue.on('error', (err) => {
  logger.error('Queue error', { err: err.message });
});

module.exports = jobQueue;
