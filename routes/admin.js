const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

async function isAdmin(req) {
  const user = await db.users.findById(req.user.id);
  return user?.role === 'Admin';
}

router.get('/accounts', async (req, res) => {
  if (!await isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const accounts = await db.users.managedAccounts();
  return res.status(200).json({ success: true, accounts });
});

router.post('/accounts', async (req, res) => {
  if (!await isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { name, email, password, role, phone, vehicle } = req.body || {};
  const normalizedRole = String(role || '').trim().toUpperCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!name?.trim() || !normalizedEmail || !password || password.length < 12) {
    return res.status(400).json({ success: false, message: 'Name, email, and a password of at least 12 characters are required' });
  }

  if (!['ADMIN', 'DRIVER', 'FLEET'].includes(normalizedRole)) {
    return res.status(400).json({ success: false, message: 'Admins can create Admin, Driver, or Fleet accounts only' });
  }

  if (normalizedRole === 'DRIVER' && (!phone?.trim() || !vehicle?.trim())) {
    return res.status(400).json({ success: false, message: 'Phone and vehicle are required for Driver accounts' });
  }

  try {
    const account = await db.users.createManaged({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: normalizedRole,
      phone: phone?.trim() || null,
      vehicle: vehicle?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      account: { id: account.id, name: account.name, email: account.email, role: account.role },
      loginPath: ({ ADMIN: '/admin/login', DRIVER: '/driver/login', FLEET: '/fleet/login' })[normalizedRole],
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      console.error('Managed account unique constraint conflict:', target);
      if (Array.isArray(target) && target.includes('email')) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }
      return res.status(409).json({ success: false, message: 'A Driver profile is already linked to this account' });
    }
    throw error;
  }
});

router.get('/overview', async (req, res) => {
  if (!await isAdmin(req)) {
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

router.get('/payments', async (req, res) => {
  if (!await isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const payments = await db.payments.all();
  return res.status(200).json({ success: true, payments });
});

module.exports = router;
