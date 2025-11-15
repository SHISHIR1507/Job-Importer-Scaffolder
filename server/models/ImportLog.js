const mongoose = require('mongoose');

const ImportLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    importDateTime: { type: Date, default: Date.now },
    total: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    failedReasons: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImportLog', ImportLogSchema);
