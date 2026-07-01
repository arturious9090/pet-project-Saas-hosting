import { MimeType } from '@prisma/client';

export const MIME_TYPE_VALUES = {
  [MimeType.APPLICATION_PDF]: 'application/pdf',
  [MimeType.APPLICATION_JSON]: 'application/json',
  [MimeType.APPLICATION_XML]: 'application/xml',
  [MimeType.APPLICATION_ZIP]: 'application/zip',
  [MimeType.APPLICATION_OCTET_STREAM]: 'application/octet-stream',

  [MimeType.TEXT_PLAIN]: 'text/plain',
  [MimeType.TEXT_HTML]: 'text/html',
  [MimeType.TEXT_CSS]: 'text/css',
  [MimeType.TEXT_JAVASCRIPT]: 'text/javascript',

  [MimeType.IMAGE_JPEG]: 'image/jpeg',
  [MimeType.IMAGE_PNG]: 'image/png',
  [MimeType.IMAGE_GIF]: 'image/gif',
  [MimeType.IMAGE_WEBP]: 'image/webp',
  [MimeType.IMAGE_SVG_XML]: 'image/svg+xml',
  [MimeType.IMAGE_BMP]: 'image/bmp',
  [MimeType.IMAGE_TIFF]: 'image/tiff',

  [MimeType.VIDEO_MP4]: 'video/mp4',
  [MimeType.VIDEO_WEBM]: 'video/webm',
  [MimeType.VIDEO_OGG]: 'video/ogg',
  [MimeType.VIDEO_QUICKTIME]: 'video/quicktime',
  [MimeType.VIDEO_X_MSVIDEO]: 'video/x-msvideo',

  [MimeType.AUDIO_MPEG]: 'audio/mpeg',
  [MimeType.AUDIO_WAV]: 'audio/wav',
  [MimeType.AUDIO_OGG]: 'audio/ogg',
  [MimeType.AUDIO_WEBM]: 'audio/webm',

  [MimeType.MULTIPART_FORM_DATA]: 'multipart/form-data',
} as const;

export type MimeTypeValue =
  (typeof MIME_TYPE_VALUES)[keyof typeof MIME_TYPE_VALUES];