const { Worker } = require('bullmq');
const ImportLog = require('../models/ImportLog');
const { upsertJobRecord } = require('../services/jobImportService');
const logger = require('../utils/logger');

const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '50', 10);

const worker = new Worker(
  'job-import-queue',
  async (job) => {
    const { jobData, importLogId } = job.data;
    const { wasNew } = await upsertJobRecord(jobData);

    await ImportLog.findByIdAndUpdate(importLogId, {
      $inc: {
        newJobs: wasNew ? 1 : 0,
        updatedJobs: wasNew ? 0 : 1,
      },
    });

    return { status: 'ok', wasNew };
  },
  {
    concurrency,
    connection: { url: process.env.REDIS_URL },
  }
);

worker.on('completed', (job, result) => {
  logger.info('Processed job', {
    jobId: job.id,
    wasNew: result?.wasNew,
  });
});

worker.on('failed', async (job, err) => {
  logger.error('Job failed', { jobId: job?.id, err: err.message });
  if (job?.data?.importLogId) {
    await ImportLog.findByIdAndUpdate(job.data.importLogId, {
      $inc: { failedJobs: 1 },
      $push: { failedReasons: err.message },
    });
  }
});

module.exports = worker;
