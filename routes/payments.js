const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const payments = await db.payments.allByUser(req.user.id);
  return res.status(200).json({ success: true, payments });
});

router.post('/topup', authenticateToken, async (req, res) => {
  const { amount } = req.body || {};
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount required' });
  }

  const payment = await db.payments.create({
    user_id: Number(req.user.id),
    amount: value,
    type: 'topup',
    status: 'completed',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, message: 'Top-up successful', payment });
});

module.exports = router;
