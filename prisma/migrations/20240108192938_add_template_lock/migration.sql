-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "templateLockId" TEXT,
ADD COLUMN     "templateLockedAt" TIMESTAMP(3),
ADD COLUMN     "templateLockedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_templateLockedByUserId_fkey" FOREIGN KEY ("templateLockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
