import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { MIME_TYPE_VALUES } from 'src/common/types/mime-types-value';

@Controller()
export class ServeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get('*')
  async serve(@Req() req: Request, @Res() res: Response) {
    const projectId = req.headers['x-project-id'] as string;
    if (!projectId) {
      throw new NotFoundException('Project not found');
    }

    let filePath = this.normalizePath(req.path);

    // 1. Exact file match
    let file = await this.findFile(projectId, filePath);

    // 2. SPA fallback (вариант Б)
    if (!file) {
      file = await this.spaFallback(projectId, filePath);
    }

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Conditional GET — 304 Not Modified
    if (
      file.hashSum &&
      req.headers['if-none-match'] === file.hashSum
    ) {
      return res.status(304).end();
    }

    // Set response headers
    const contentType = file.mimeType
      ? MIME_TYPE_VALUES[file.mimeType]
      : 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Length': file.size?.toString() ?? '0',
      'ETag': file.hashSum ?? '',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });

    // Stream file from S3
    const s3Object = await this.storage.getFileStream(file.key);
    if (s3Object.Body) {
      (s3Object.Body as NodeJS.ReadableStream).pipe(res);
    } else {
      throw new NotFoundException('File body empty');
    }
  }

  private normalizePath(rawPath: string): string {
    // Remove trailing slash(es)
    let path = rawPath.replace(/\/+$/, '') || '';
    // Ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // Root path defaults to /index.html
    if (path === '/') {
      path = '/index.html';
    }
    return path;
  }

  private async findFile(projectId: string, path: string) {
    return this.prisma.file.findFirst({
      where: {
        projectId,
        path,
        status: 'UPLOADED',
        hashSum: { not: null },
      },
    });
  }

  private async spaFallback(
    projectId: string,
    filePath: string,
  ) {
    // 2a. Try /path.html (if no extension)
    if (!filePath.match(/\.\w{2,5}$/)) {
      const withHtml = await this.findFile(projectId, filePath + '.html');
      if (withHtml) return withHtml;
    }

    // 2b. Try /path/index.html
    const indexPath = filePath.replace(/\/$/, '') + '/index.html';
    const index = await this.findFile(projectId, indexPath);
    if (index) return index;

    // 2c. Fallback to /index.html (SPA)
    const rootIndex = await this.findFile(projectId, '/index.html');
    return rootIndex;
  }
}