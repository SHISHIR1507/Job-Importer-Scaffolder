const express = require('express');
const ImportLog = require('../models/ImportLog');

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  try {
    const logs = await ImportLog.find()
      .sort({ importDateTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load import logs', error: err.message });
  }
});

module.exports = router;
