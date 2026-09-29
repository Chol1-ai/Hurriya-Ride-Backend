const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const rides = await db.rides.allByUser(req.user.id);
  return res.status(200).json({ success: true, rides });
});

router.post('/request', authenticateToken, async (req, res) => {
  const { pickup, destination, vehicleType } = req.body || {};

  if (!pickup || !destination || !vehicleType) {
    return res.status(400).json({
      success: false,
      message: 'Pickup, destination, and vehicleType are required',
    });
  }

  const fare = vehicleType === 'Car' ? 7500 : vehicleType === 'XL' ? 9000 : vehicleType === 'Tuktuk' ? 4000 : 4500;
  const ride = await db.rides.create({
    user_id: Number(req.user.id),
    pickup,
    destination,
    vehicle_type: vehicleType,
    fare,
    status: 'requested',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, message: 'Ride requested successfully', ride });
});

router.get('/:id', authenticateToken, async (req, res) => {
  const ride = await db.rides.findByIdAndUser(req.params.id, req.user.id);

  if (!ride) {
    return res.status(404).json({ success: false, message: 'Ride not found' });
  }

  return res.status(200).json({ success: true, ride });
});

module.exports = router;
