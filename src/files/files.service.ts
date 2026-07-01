import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CraeteFileDto } from './dto/create-file.dto';
import { File, FileStatus } from '@prisma/client';
import { StorageService } from 'src/storage/storage.service';
import { randomUUID } from 'node:crypto';
import { MIME_TYPE_BY_VALUE } from 'src/common/types/mime-types-by-value';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class FilesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService
    ) { }

    async createFile(projectId: string, userId: string, dto: CraeteFileDto) {
        const storedName = randomUUID()
        const fileExtesion = dto.mimeType.split('/')[1] // Сделать нормальное определение расширения файла. 
        const key = this.storage.createKey(userId, projectId, storedName, fileExtesion)

        const file = await this.prisma.file.create({
            data: {
                project: { connect: { id: projectId } },
                name: dto.fileName,
                storedName,
                mimeType: MIME_TYPE_BY_VALUE[dto.mimeType],
                path: dto.path,
                size: dto.size,
                status: FileStatus.PENDING_UPLOAD,
                key,
                ownerId: userId
            },
        })

        return file
    }

    async checkFile(file: File) {
        const fileHead = await this.storage.getFileHead(file.key)

        if ( file.size != fileHead.ContentLength ) {
            return await this.prisma.file.update({
                where: {id: file.id},
                data: {
                    status: FileStatus.REJECTED
                }
            })
        }
        return await this.prisma.file.update({
            where: {id: file.id},
            data: {
                hashSum: fileHead.ETag,
                status: FileStatus.UPLOADED
            }
        })
    }

    async findFile(fileId: string) {
        try {
            return await this.prisma.file.findUniqueOrThrow({ where: { id: fileId } })
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('File not found');
            throw new InternalServerErrorException('File system error')
        }
    }
}
