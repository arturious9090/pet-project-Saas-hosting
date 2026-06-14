import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CraeteFileDto } from './dto/create-file.dto';
import { FileStatus } from '@prisma/client';
import { StorageService } from 'src/storage/storage.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class FilesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService
    ) { }

    async createFile(projectId: string, userId: string, dto: CraeteFileDto) {
        const storedName = randomUUID()
        const key = this.storage.createKey(userId, projectId, storedName)
        
        const file = await this.prisma.file.create({
            data: {
                project: { connect: { id: projectId } },
                name: dto.fileName,
                storedName, 
                mimeType: dto.mimeType,
                path: dto.path,
                size: dto.size,
                status: FileStatus.PENDING_UPLOAD,
                key,         
                ownerId: userId
            },
        })

        return file
    }
}
