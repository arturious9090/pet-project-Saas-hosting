/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PANDING', 'VERIFIED', 'BANNED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'DRAFT', 'DELETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MimeType" AS ENUM ('APPLICATION_PDF', 'APPLICATION_JSON', 'APPLICATION_XML', 'APPLICATION_ZIP', 'APPLICATION_OCTET_STREAM', 'TEXT_PLAIN', 'TEXT_HTML', 'TEXT_CSS', 'TEXT_JAVASCRIPT', 'IMAGE_JPEG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_SVG_XML', 'IMAGE_BMP', 'IMAGE_TIFF', 'VIDEO_MP4', 'VIDEO_WEBM', 'VIDEO_OGG', 'VIDEO_QUICKTIME', 'VIDEO_X_MSVIDEO', 'AUDIO_MPEG', 'AUDIO_WAV', 'AUDIO_OGG', 'AUDIO_WEBM', 'AUDIO_MP3', 'MULTIPART_FORM_DATA');

-- CreateEnum
CREATE TYPE "FileExtension" AS ENUM ('JPG', 'JPEG', 'PNG', 'GIF', 'SVG', 'WEBP', 'TIFF', 'BMP', 'HEIC', 'PDF', 'TXT', 'DOC', 'DOCX', 'RTF', 'ODT', 'XLS', 'XLSX', 'CSV', 'ODS', 'PPT', 'PPTX', 'ODP', 'ZIP', 'RAR', 'TAR', 'GZ', 'MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'MP4', 'AVI', 'MKV', 'MOV', 'WMV', 'FLV', 'JS', 'TS', 'JSON', 'XML', 'HTML', 'CSS', 'MD', 'YAML', 'YML', 'SQL', 'SH', 'PY', 'RB', 'PHP', 'JAVA', 'C', 'CPP', 'CS', 'GO', 'RS', 'EXE', 'BAT', 'BIN', 'DLL', 'ISO', 'DMG', 'APK');

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PANDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "ip" TEXT,
    "ua" TEXT,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mimeType" "MimeType" NOT NULL,
    "path" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hashSum" TEXT NOT NULL,
    "extension" "FileExtension" NOT NULL,
    "metaData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_storedName_key" ON "File"("storedName");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
