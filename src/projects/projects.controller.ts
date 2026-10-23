import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from 'src/auth/session.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InitFileUploadDto } from './dto/init-file-upload.dto';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors } from '../swagger/api-errors.decorator';
import { SESSION_SECURITY } from '../swagger/swagger';
import {
  ProjectDetailsResponseDto,
  ProjectResponseDto,
} from './dto/project-response.dto';
import { FileUploadResponseDto } from './dto/file-upload-response.dto';
import { FileResponseDto } from '../files/dto/file-response.dto';

@ApiTags('Projects')
@ApiCookieAuth(SESSION_SECURITY)
@ApiErrors(401, 404, 500)
@UseGuards(SessionGuard)
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary: 'Создать проект',
    description:
      'Создаёт DRAFT-проект текущего пользователя, связанный домен <projectId>.<DOMAIN_NAME> и маршрут Traefik через etcd. В ответе — только поля Project, без domain и files.',
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({
    type: ProjectResponseDto,
    description: 'Проект создан, статус DRAFT.',
  })
  @ApiErrors(400)
  @Post()
  async create(@Req() req: CurrentUserRequest, @Body() dto: CreateProjectDto) {
    return await this.projectsService.create(dto, req.user.id);
  }

  @ApiOperation({
    summary: 'Получить свои проекты',
    description:
      'Возвращает массив проектов текущего пользователя. Пагинация и фильтры не реализованы; files и domain не включаются.',
  })
  @ApiOkResponse({
    type: [ProjectResponseDto],
    description: 'Список проектов, возможно пустой.',
  })
  @Get()
  async list(@Req() req: CurrentUserRequest) {
    return await this.projectsService.findMany(req.user.id);
  }

  @ApiOperation({
    summary: 'Получить проект и его файлы',
    description:
      'Доступен только владельцу. Чужой проект возвращает 404. Список files содержит записи всех статусов, в том числе незавершённые загрузки.',
  })
  @ApiParam({
    name: 'projectId',
    example: 'cmproject1234567890abcdef',
    description: 'CUID проекта; формат отдельно не валидируется.',
  })
  @ApiOkResponse({ type: ProjectDetailsResponseDto })
  @Get(':projectId')
  async find(
    @Param('projectId') projectId: string,
    @Req() req: CurrentUserRequest,
  ) {
    const project = await this.projectsService.find(projectId);
    if (project?.ownerId != req.user.id) throw new NotFoundException();
    return project;
  }

  @ApiOperation({
    summary: 'Переименовать проект',
    description:
      'Обновление выполняется через POST. Доступно только поле name; чужой проект возвращает 404. Пустое тело допустимо.',
  })
  @ApiParam({ name: 'projectId', example: 'cmproject1234567890abcdef' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiCreatedResponse({
    type: ProjectResponseDto,
    description: 'Обновлённый проект (стандартный статус POST — 201).',
  })
  @ApiErrors(400)
  @Post(':projectId')
  async update(
    @Param('projectId') projectId: string,
    @Req() req: CurrentUserRequest,
    @Body() dto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.find(projectId);
    if (project?.ownerId != req.user.id) throw new NotFoundException();
    return await this.projectsService.update(dto, project.id);
  }

  @ApiOperation({
    summary: 'Инициализировать загрузку файла',
    description:
      'Шаг 1: создаётся запись PENDING_UPLOAD и подписанный S3 URL на 900 секунд. Шаг 2: отправьте бинарный файл методом PUT на uploadUrl, передав headers из ответа. Шаг 3: вызовите complete с fileId. PUT не является маршрутом этого API.',
  })
  @ApiParam({ name: 'projectId', example: 'cmproject1234567890abcdef' })
  @ApiBody({ type: InitFileUploadDto })
  @ApiCreatedResponse({
    type: FileUploadResponseDto,
    description: 'Данные для прямой загрузки в S3/MinIO.',
  })
  @ApiErrors(400)
  @Post(':projectId/files/init')
  async initFileUpload(
    @Param('projectId') projectId: string,
    @Req() req: CurrentUserRequest,
    @Body() dto: InitFileUploadDto,
  ) {
    return await this.projectsService.createFileUploadRequest(
      req.user.id,
      projectId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Проверить и завершить загрузку файла',
    description:
      'Вызывать после успешного PUT в S3/MinIO. Проверяются владелец, projectId и ContentLength объекта. При совпадении размера сохраняются ETag и статус UPLOADED, файл доступен ServeController. При несовпадении сохраняется REJECTED и возвращается 403. Отсутствующий объект S3 возвращает 404. Тело запроса не требуется.',
  })
  @ApiParam({ name: 'projectId', example: 'cmproject1234567890abcdef' })
  @ApiParam({ name: 'fileId', example: 'cmfile1234567890abcdef1234' })
  @ApiCreatedResponse({
    type: FileResponseDto,
    description: 'Проверенный файл со статусом UPLOADED и ETag в hashSum.',
  })
  @ApiErrors(403)
  @Post(':projectId/files/:fileId/complete')
  async completeFileUpload(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Req() req: CurrentUserRequest,
  ) {
    return await this.projectsService.completeFileUpload(
      fileId,
      req.user.id,
      projectId,
    );
  }
}
