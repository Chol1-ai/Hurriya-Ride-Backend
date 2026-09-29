const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/available', authenticateToken, async (req, res) => {
  const drivers = await db.drivers.available();
  return res.status(200).json({ success: true, drivers });
});

router.get('/:id', authenticateToken, async (req, res) => {
  const driver = await db.drivers.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  return res.status(200).json({ success: true, driver });
});

module.exports = router;
