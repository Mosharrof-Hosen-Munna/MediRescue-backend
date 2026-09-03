/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'EN_ROUTE', 'ARRIVED', 'PATIENT_PICKED_UP', 'AT_HOSPITAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencyRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_AMBULANCE_AVAILABLE');

-- CreateTable
CREATE TABLE "ambulances" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT,
    "year" INTEGER,
    "capacity" INTEGER,
    "status" "AmbulanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "typeId" TEXT NOT NULL,

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambulance_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseFare" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambulance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatches" (
    "id" TEXT NOT NULL,
    "emergencyRequestId" TEXT NOT NULL,
    "ambulanceId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "hospitalArrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "ambulanceTypeId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "emergencyDescription" TEXT,
    "patientCondition" TEXT,
    "additionalNotes" TEXT,
    "status" "EmergencyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ambulances_registrationNo_key" ON "ambulances"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "ambulances_driverId_key" ON "ambulances"("driverId");

-- CreateIndex
CREATE INDEX "ambulances_status_idx" ON "ambulances"("status");

-- CreateIndex
CREATE INDEX "ambulances_typeId_idx" ON "ambulances"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "ambulance_types_name_key" ON "ambulance_types"("name");

-- CreateIndex
CREATE INDEX "ambulance_types_isActive_idx" ON "ambulance_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_emergencyRequestId_key" ON "dispatches"("emergencyRequestId");

-- CreateIndex
CREATE INDEX "dispatches_ambulanceId_idx" ON "dispatches"("ambulanceId");

-- CreateIndex
CREATE INDEX "dispatches_driverId_idx" ON "dispatches"("driverId");

-- CreateIndex
CREATE INDEX "dispatches_hospitalId_idx" ON "dispatches"("hospitalId");

-- CreateIndex
CREATE INDEX "dispatches_status_idx" ON "dispatches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_requests_requestNumber_key" ON "emergency_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "emergency_requests_patientId_idx" ON "emergency_requests"("patientId");

-- CreateIndex
CREATE INDEX "emergency_requests_serviceTypeId_idx" ON "emergency_requests"("serviceTypeId");

-- CreateIndex
CREATE INDEX "emergency_requests_ambulanceTypeId_idx" ON "emergency_requests"("ambulanceTypeId");

-- CreateIndex
CREATE INDEX "emergency_requests_addressId_idx" ON "emergency_requests"("addressId");

-- CreateIndex
CREATE INDEX "emergency_requests_status_idx" ON "emergency_requests"("status");

-- CreateIndex
CREATE INDEX "emergency_requests_requestedAt_idx" ON "emergency_requests"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");

-- CreateIndex
CREATE INDEX "service_types_isActive_idx" ON "service_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- AddForeignKey
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ambulance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_emergencyRequestId_fkey" FOREIGN KEY ("emergencyRequestId") REFERENCES "emergency_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_ambulanceTypeId_fkey" FOREIGN KEY ("ambulanceTypeId") REFERENCES "ambulance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
