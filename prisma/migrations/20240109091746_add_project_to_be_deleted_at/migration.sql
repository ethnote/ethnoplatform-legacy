-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ProjectDeleteWarning';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "setToBeDeletedAt" TIMESTAMP(3);
