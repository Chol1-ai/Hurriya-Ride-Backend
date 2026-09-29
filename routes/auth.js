const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function normalizeRole(role = 'Passenger') {
  const value = String(role || 'Passenger').trim();
  const mapped = {
    passenger: 'Passenger',
    driver: 'Driver',
    fleet: 'Fleet',
    admin: 'Admin',
  };

  return mapped[value.toLowerCase()] || 'Passenger';
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'hurriya-dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'Passenger' } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (normalizeRole(role) !== 'Passenger') {
    return res.status(403).json({ success: false, message: 'Public registration is limited to Passenger accounts' });
  }

  try {
    const existing = await db.users.findByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Passenger',
    });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = createToken(safeUser);

    return res.status(201).json({ success: true, token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await db.users.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: normalizeRole(user.role) };
    const token = createToken(safeUser);

    return res.status(200).json({ success: true, token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const user = await db.users.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: normalizeRole(user.role) };
  return res.status(200).json({ success: true, user: safeUser });
});

module.exports = router;
