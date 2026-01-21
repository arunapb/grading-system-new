/*
  Warnings:

  - You are about to drop the column `email` on the `Admin` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Admin_email_key";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "email";

-- AlterTable
ALTER TABLE "StudentInvitation" ADD COLUMN     "lastBrowser" TEXT,
ADD COLUMN     "lastDevice" TEXT,
ADD COLUMN     "lastIpAddress" TEXT,
ADD COLUMN     "lastOs" TEXT,
ADD COLUMN     "lastUserAgent" TEXT;
