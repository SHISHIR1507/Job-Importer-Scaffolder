const cron = require('node-cron');
const { queueJobsForFeed } = require('../services/jobImportService');
const logger = require('../utils/logger');

function parseFeeds() {
  return (process.env.JOB_FEEDS || '')
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, url] = entry.split('|');
      return { name: name?.trim(), url: url?.trim() };
    })
    .filter((feed) => feed.name && feed.url);
}

async function processFeeds() {
  const feeds = parseFeeds();
  if (!feeds.length) {
    logger.warn('No JOB_FEEDS configured; skipping run');
    return;
  }

  for (const feed of feeds) {
    try {
      await queueJobsForFeed(feed);
    } catch (err) {
      logger.error('Feed ingestion failed', { feed: feed.name, err: err.message });
    }
  }
}

function scheduleFeedImports() {
  const cronExpression = process.env.CRON_EXPRESSION || '0 * * * *';
  cron.schedule(cronExpression, () => {
    logger.info('Starting scheduled job import');
    processFeeds();
  });

  logger.info('Scheduled cron job', { cronExpression });
}

module.exports = {
  processFeeds,
  scheduleFeedImports,
};
