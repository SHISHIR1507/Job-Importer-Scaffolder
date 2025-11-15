const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    company: { type: String },
    location: { type: String },
    description: { type: String },
    url: { type: String },
    source: { type: String },
    publishedAt: { type: Date },
    rawPayload: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
