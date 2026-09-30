const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeRole(role = 'Passenger') {
  const value = String(role || 'Passenger').trim().toLowerCase();
  const mapped = {
    passenger: 'Passenger',
    driver: 'Driver',
    fleet: 'Fleet',
    admin: 'Admin',
  };
  return mapped[value] || 'Passenger';
}

function dbRole(role = 'Passenger') {
  return normalizeRole(role).toUpperCase();
}

function normalizeStatus(status = 'AVAILABLE', fallback = 'AVAILABLE') {
  const value = String(status || fallback).trim().toLowerCase();
  const mapped = {
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline',
    requested: 'Requested',
    matched: 'Matched',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    failed: 'Failed',
    topup: 'Topup',
    ride_settlement: 'Ride settlement',
  };
  return mapped[value] || fallback;
}

function dbStatus(value, fallback = 'AVAILABLE') {
  return normalizeStatus(value, fallback).toUpperCase();
}

function mapUser(user) {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role),
  };
}

function mapDriver(driver) {
  if (!driver) return null;
  return {
    ...driver,
    status: normalizeStatus(driver.status, 'Available'),
  };
}

function mapPayment(payment) {
  if (!payment) return null;
  return {
    ...payment,
    type: normalizeStatus(payment.type, 'Topup'),
    status: normalizeStatus(payment.status, 'Completed'),
  };
}

const db = {
  health: async () => {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  },
  users: {
    all: async () => (await prisma.user.findMany()).map(mapUser),
    managedAccounts: async () => prisma.user.findMany({
      where: { role: { in: ['DRIVER', 'FLEET'] } },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }).then((users) => users.map(mapUser)),
    findByEmail: async (email) => mapUser(await prisma.user.findUnique({ where: { email } })),
    findById: async (id) => mapUser(await prisma.user.findUnique({ where: { id: Number(id) } })),
    create: async (user) => mapUser(await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: dbRole(user.role),
      },
    })),
    createManaged: async (user) => prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: user.password,
          role: dbRole(user.role),
        },
      });

      if (normalizeRole(user.role) === 'Driver') {
        await transaction.driver.create({
          data: {
            userId: createdUser.id,
            name: user.name,
            phone: user.phone,
            vehicle: user.vehicle,
            status: 'AVAILABLE',
          },
        });
      }

      return mapUser(createdUser);
    }),
  },
  rides: {
    allByUser: async (userId) => (await prisma.ride.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    })).map((ride) => ({ ...ride, status: normalizeStatus(ride.status, 'Requested') })),
    findByIdAndUser: async (id, userId) => {
      const ride = await prisma.ride.findFirst({ where: { id: Number(id), userId: Number(userId) } });
      if (!ride) return null;
      return { ...ride, status: normalizeStatus(ride.status, 'Requested') };
    },
    create: async (ride) => {
      const created = await prisma.ride.create({ data: {
        userId: Number(ride.user_id),
        pickup: ride.pickup,
        pickupLat: ride.pickup_lat ?? null,
        pickupLng: ride.pickup_lng ?? null,
        destination: ride.destination,
        destinationLat: ride.destination_lat ?? null,
        destinationLng: ride.destination_lng ?? null,
        distanceMeters: ride.distance_meters ?? null,
        vehicleType: ride.vehicle_type,
        fare: Number(ride.fare),
        status: dbStatus(ride.status, 'REQUESTED'),
      } });
      return { ...created, status: normalizeStatus(created.status, 'Requested') };
    },
  },
  payments: {
    all: async () => (await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    })).map(mapPayment),
    allByUser: async (userId) => (await prisma.payment.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    })).map(mapPayment),
    create: async (payment) => {
      const created = await prisma.payment.create({ data: {
        userId: Number(payment.user_id),
        amount: Number(payment.amount),
        type: dbStatus(payment.type, 'TOPUP'),
        status: dbStatus(payment.status, 'COMPLETED'),
      } });
      return {
        ...created,
        type: normalizeStatus(created.type, 'Topup'),
        status: normalizeStatus(created.status, 'Completed'),
      };
    },
    totals: async () => {
      const [count, revenue] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      ]);
      return {
        count,
        revenue: Number(revenue._sum.amount || 0),
      };
    },
  },
  drivers: {
    available: async () => (await prisma.driver.findMany({ where: { status: 'AVAILABLE' } })).map(mapDriver),
    findById: async (id) => mapDriver(await prisma.driver.findUnique({ where: { id: Number(id) } })),
    count: async () => prisma.driver.count(),
  },
  ridesCount: async () => prisma.ride.count(),
  reset: async () => {
    await prisma.payment.deleteMany();
    await prisma.ride.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();
  },
};

module.exports = db;
