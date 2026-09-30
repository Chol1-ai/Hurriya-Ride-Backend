-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION,
ADD COLUMN     "distanceMeters" INTEGER,
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION;
