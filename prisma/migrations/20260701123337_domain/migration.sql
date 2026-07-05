/*
  Warnings:

  - The values [AUDIO_MP3] on the enum `MimeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MimeType_new" AS ENUM ('APPLICATION_PDF', 'APPLICATION_JSON', 'APPLICATION_XML', 'APPLICATION_ZIP', 'APPLICATION_OCTET_STREAM', 'TEXT_PLAIN', 'TEXT_HTML', 'TEXT_CSS', 'TEXT_JAVASCRIPT', 'IMAGE_JPEG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_SVG_XML', 'IMAGE_BMP', 'IMAGE_TIFF', 'VIDEO_MP4', 'VIDEO_WEBM', 'VIDEO_OGG', 'VIDEO_QUICKTIME', 'VIDEO_X_MSVIDEO', 'AUDIO_MPEG', 'AUDIO_WAV', 'AUDIO_OGG', 'AUDIO_WEBM', 'MULTIPART_FORM_DATA');
ALTER TABLE "File" ALTER COLUMN "mimeType" TYPE "MimeType_new" USING ("mimeType"::text::"MimeType_new");
ALTER TYPE "MimeType" RENAME TO "MimeType_old";
ALTER TYPE "MimeType_new" RENAME TO "MimeType";
DROP TYPE "public"."MimeType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "rootDomain" TEXT NOT NULL,
    "subdomain" TEXT,
    "fqdn" TEXT NOT NULL,
    "ipv6" TEXT,
    "proxied" BOOLEAN NOT NULL DEFAULT true,
    "zoneId" TEXT NOT NULL,
    "cfRecordIds" JSONB NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_fqdn_key" ON "Domain"("fqdn");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_projectId_key" ON "Domain"("projectId");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
