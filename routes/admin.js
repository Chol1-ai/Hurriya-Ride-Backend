const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', async (req, res) => {
  const user = await db.users.findById(req.user.id);
  if (!user || user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const [paymentStats, rideCount, driverCount] = await Promise.all([
    db.payments.totals(),
    db.ridesCount(),
    db.drivers.count(),
  ]);

  return res.status(200).json({
    success: true,
    overview: {
      rideCount,
      paymentCount: paymentStats.count,
      driverCount,
      revenue: paymentStats.revenue,
    },
  });
});

module.exports = router;
