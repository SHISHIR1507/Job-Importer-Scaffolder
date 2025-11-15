const axios = require('axios');
const xml2js = require('xml2js');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const jobQueue = require('../queues/jobQueue');
const logger = require('../utils/logger');

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickExternalId(item, feedName) {
  return (
    item.guid?._ ||
    item.guid ||
    item.id ||
    item.link ||
    `${feedName}-${item.title || 'job'}-${item.pubDate || Date.now()}`
  ).toString();
}

function transformItem(item, feedName) {
  return {
    externalId: pickExternalId(item, feedName),
    title: item.title || 'Untitled role',
    company: item.company || item['dc:creator'] || '',
    location: item.location || item.city || item.region || '',
    description: item.description || item.summary || '',
    url: item.link || item.url || '',
    source: feedName,
    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    rawPayload: item,
  };
}

async function queueJobsForFeed(feed) {
  const importLog = await ImportLog.create({
    fileName: feed.name,
    importDateTime: new Date(),
  });

  let items = [];

  try {
    const response = await axios.get(feed.url, { timeout: 20000 });
    const parsed = await parser.parseStringPromise(response.data);
    const channelItems = parsed?.rss?.channel?.item;
    const atomEntries = parsed?.feed?.entry;
    const genericJobs = parsed?.jobs?.job;
    items = toArray(channelItems || atomEntries || genericJobs);

    await ImportLog.findByIdAndUpdate(importLog._id, { total: items.length });

    await Promise.all(
      items.map((item) =>
        jobQueue.add(
          'importJob',
          {
            jobData: transformItem(item, feed.name),
            importLogId: importLog._id,
          },
          {
            attempts: 3,
            removeOnComplete: true,
            backoff: { type: 'exponential', delay: 1000 },
          }
        )
      )
    );

    logger.info('Queued jobs for feed', { feed: feed.name, count: items.length });
    return { importLogId: importLog._id, totalEnqueued: items.length };
  } catch (err) {
    logger.error('Failed to queue feed', { feed: feed.name, err: err.message });
    await ImportLog.findByIdAndUpdate(importLog._id, {
      failedJobs: items.length || 1,
      $push: { failedReasons: err.message },
    });
    throw err;
  }
}

async function upsertJobRecord(jobData) {
  const existing = await Job.findOne({ externalId: jobData.externalId });

  if (existing) {
    Object.assign(existing, jobData);
    await existing.save();
    return { job: existing, wasNew: false };
  }

  const created = await Job.create(jobData);
  return { job: created, wasNew: true };
}

module.exports = {
  queueJobsForFeed,
  upsertJobRecord,
};
