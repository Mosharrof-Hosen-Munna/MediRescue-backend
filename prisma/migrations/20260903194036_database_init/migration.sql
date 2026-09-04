/*
  Warnings:

  - You are about to drop the column `hospitalId` on the `dispatches` table. All the data in the column will be lost.
  - You are about to drop the column `addressId` on the `emergency_requests` table. All the data in the column will be lost.
  - Added the required column `pickupAddress` to the `emergency_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dispatches_hospitalId_idx";

-- DropIndex
DROP INDEX "emergency_requests_addressId_idx";

-- AlterTable
ALTER TABLE "dispatches" DROP COLUMN "hospitalId";

-- AlterTable
ALTER TABLE "emergency_requests" DROP COLUMN "addressId",
ADD COLUMN     "pickupAddress" TEXT NOT NULL;
