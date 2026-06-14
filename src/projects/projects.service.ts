import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InitFileUploadDto } from './dto/init-file-upload.dto';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService
    ) { }

    async create(dto: CreateProjectDto, userId: string) {
        try {
            return this.prisma.project.create({
                data: {
                    name: dto.name,
                    status: ProjectStatus.DRAFT,
                    owner: { connect: { id: userId } }
                }
            })
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
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { files: true }
        })
        if (!project) throw new NotFoundException()
        return project
    }

    async findMany(userId: string) {
        return await this.prisma.project.findMany({ where: { ownerId: userId } })
    }

    async createFileUploadRequest(userId: string, projectId: string, dto: InitFileUploadDto) {

        const file = await this.filesService.createFile(projectId, userId, dto)
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
        
    }
}
