import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { FileStatus, Prisma, Project, ProjectStatus } from '@prisma/client';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InitFileUploadDto } from './dto/init-file-upload.dto';
import { FilesService } from 'src/files/files.service';
import { StorageService } from 'src/storage/storage.service';
import { TraefikService } from 'src/traefik/traefik.service';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService,
        private readonly storageService: StorageService,
        private readonly traefik: TraefikService,
        private readonly config: ConfigService
    ) { }

    async create(dto: CreateProjectDto, userId: string) {
        try {
            const project = await this.prisma.project.create({ // обернуть все в транзакцию 
                data: {
                    name: dto.name,
                    status: ProjectStatus.DRAFT,
                    owner: { connect: { id: userId } },
                }
            })
            const projectDomain = await this.prisma.project.update({
                where: { id: project.id },
                data: {
                    domain: {
                        create: {
                            rootDomain: this.config.getOrThrow<string>('app.domainName'),
                            subdomain: project.id,
                            fqdn: project.id + '.' + this.config.getOrThrow<string>('app.domainName'),
                            zoneId: '',
                            cfRecordIds: {}
                        }
                    }
                },
                include: { domain: true }
            })

            await this.traefik.addProject(projectDomain.domain!.fqdn, projectDomain.id)
            return project

        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('User not found');
            }

            throw error;
        }
    }

    async update(dto: UpdateProjectDto, projectId: string) {
        try {
            return await this.prisma.project.update({
                where: { id: projectId },
                data: {
                    ...dto
                }
            })
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Project not found');
            }

            throw error;
        }
    }

    async find(projectId: string): Promise<Project> {
        try {
            return await this.prisma.project.findUniqueOrThrow({
                where: { id: projectId },
                include: { files: true }
            })        
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') throw new NotFoundException('Project not found');
            throw err
        }
    }

    async findMany(userId: string) {
        return await this.prisma.project.findMany({ where: { ownerId: userId } })
    }

    async createFileUploadRequest(userId: string, projectId: string, dto: InitFileUploadDto) {
        try {
            const file = await this.filesService.createFile(projectId, userId, dto)
            const url = await this.storageService.createUploadUrl(file.key, dto.mimeType)
            await this.prisma.project.update({
                where: {
                    id: projectId,
                    ownerId: userId
                },
                data: {
                    files: {
                        connect: { id: file.id }
                    }
                }
            })
            return {
                ...url,
                fileId: file.id
            }         
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('Project not found')
            throw error
        }
    }

    async completeFileUpload(fileId: string, userId: string, projectId: string) {
        const file = await this.filesService.findFile(fileId)
        if (file.ownerId != userId || file.projectId != projectId) throw new NotFoundException('File not found');
        const checkedFile = await this.filesService.checkFile(file)
        if (checkedFile.status != FileStatus.UPLOADED) throw new ForbiddenException();
        await this.traefik.addFile(projectId, file.path, file.name ,file.key)
        return checkedFile
    }
}
