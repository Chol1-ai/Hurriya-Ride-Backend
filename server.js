const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { seedDemoData } = require('./prisma/seed');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const driversRoutes = require('./routes/drivers');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be set to the deployed frontend origin in production');
  }
}

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    app: 'Hurriya Ride API',
    version: '1.0.0',
    status: 'running',
  });
});

async function startServer() {
  if (!isProduction) {
    try {
      const seeded = await seedDemoData();
      console.log('Demo seed ready:', seeded);
    } catch (error) {
      console.warn('Demo seed skipped:', error.message);
    }
  } else {
    console.log('Production mode: demo seeding disabled');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
