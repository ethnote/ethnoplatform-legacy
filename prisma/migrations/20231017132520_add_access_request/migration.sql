-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nameOfInitialProject" TEXT,
    "institution" TEXT,
    "intendedUse" TEXT,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);
