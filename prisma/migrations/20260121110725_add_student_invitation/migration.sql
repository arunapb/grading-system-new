/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Admin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "username" TEXT NOT NULL,
ADD COLUMN     "verificationCode" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StudentInvitation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvitation_code_key" ON "StudentInvitation"("code");

-- CreateIndex
CREATE INDEX "StudentInvitation_code_idx" ON "StudentInvitation"("code");

-- CreateIndex
CREATE INDEX "StudentInvitation_expiresAt_idx" ON "StudentInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- AddForeignKey
ALTER TABLE "StudentInvitation" ADD CONSTRAINT "StudentInvitation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
