import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from 'src/auth/session.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';
import { UpdateProjectDto } from './dto/update-project.dto';
@UseGuards(SessionGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    async create(
        @Req() req: CurrentUserRequest,
        @Body() dto: CreateProjectDto
    ) {
        return await this.projectsService.create(dto, req.user.id)
    }

    @Get()
    async list(
        @Req() req: CurrentUserRequest
    ) {
        return await this.projectsService.findMany(req.user.id)
    }

    @Get(':project-id')
    async find(
        @Param() projectId: string,
        @Req() req: CurrentUserRequest
    ) {
        const project = await this.projectsService.find(projectId)
        if (project?.ownerId != req.user.id) throw new NotFoundException();
        return project
    }

    @Post(':project-id')
    async update(
        @Param() projectId: string,
        @Req() req: CurrentUserRequest,
        @Body() dto: UpdateProjectDto
    ) {
        const project = await this.projectsService.find(projectId)
        if (project?.ownerId != req.user.id) throw new NotFoundException();
        return await this.projectsService.update(dto, project.id)
    }

}
