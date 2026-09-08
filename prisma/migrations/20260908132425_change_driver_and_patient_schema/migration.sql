-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "profilePhotoPublicId" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "profilePhotoPublicId" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;
