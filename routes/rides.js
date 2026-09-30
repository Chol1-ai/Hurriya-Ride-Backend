const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const rides = await db.rides.allByUser(req.user.id);
  return res.status(200).json({ success: true, rides });
});

router.post('/request', authenticateToken, async (req, res) => {
  const { pickup, destination, vehicleType, pickupCoordinates, destinationCoordinates, distanceMeters } = req.body || {};

  if (!pickup || !destination || !vehicleType) {
    return res.status(400).json({
      success: false,
      message: 'Pickup, destination, and vehicleType are required',
    });
  }

  const hasCoordinates = pickupCoordinates != null || destinationCoordinates != null || distanceMeters != null;
  const validPoint = (point) => point
    && Number.isFinite(Number(point.lat))
    && Number.isFinite(Number(point.lng))
    && Number(point.lat) >= -90
    && Number(point.lat) <= 90
    && Number(point.lng) >= -180
    && Number(point.lng) <= 180;

  if (hasCoordinates && (!validPoint(pickupCoordinates) || !validPoint(destinationCoordinates))) {
    return res.status(400).json({ success: false, message: 'Valid pickup and destination coordinates are required' });
  }

  if (distanceMeters != null && (!Number.isFinite(Number(distanceMeters)) || Number(distanceMeters) < 0)) {
    return res.status(400).json({ success: false, message: 'Valid route distance is required' });
  }

  const fare = vehicleType === 'Car' ? 7500 : vehicleType === 'XL' ? 9000 : vehicleType === 'Tuktuk' ? 4000 : 4500;
  const ride = await db.rides.create({
    user_id: Number(req.user.id),
    pickup,
    pickup_lat: pickupCoordinates?.lat == null ? null : Number(pickupCoordinates.lat),
    pickup_lng: pickupCoordinates?.lng == null ? null : Number(pickupCoordinates.lng),
    destination,
    destination_lat: destinationCoordinates?.lat == null ? null : Number(destinationCoordinates.lat),
    destination_lng: destinationCoordinates?.lng == null ? null : Number(destinationCoordinates.lng),
    distance_meters: distanceMeters == null ? null : Math.round(Number(distanceMeters)),
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
