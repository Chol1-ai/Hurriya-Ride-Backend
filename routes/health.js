const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await db.health();
    return res.status(200).json({
      status: 'ok',
      message: 'Hurriya Ride backend is ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({ status: 'unavailable', message: 'Database unavailable' });
  }
});

module.exports = router;
