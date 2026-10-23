import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OpenAPIObject } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { SessionsService } from '../sessions/sessions.service';
import { ProjectsController } from '../projects/projects.controller';
import { ProjectsService } from '../projects/projects.service';
import { ServeController } from '../serve/serve.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { setupSwagger } from './swagger';

// UUID implementation is unrelated to these documentation tests; uuid 14 is ESM.
jest.mock('uuid', () => ({ v4: jest.fn() }));

describe('Swagger documentation', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        UserController,
        ProjectsController,
        ServeController,
      ],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn().mockResolvedValue('test-session-id') },
        },
        { provide: UserService, useValue: {} },
        { provide: SessionsService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: StorageService, useValue: {} },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    document = setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('covers every HTTP operation with a summary and responses', () => {
    const expected = [
      'post /api/auth/sign-in',
      'post /api/auth/sign-up',
      'post /api/auth/sign-out',
      'get /api/user/profile',
      'post /api/projects',
      'get /api/projects',
      'get /api/projects/{projectId}',
      'post /api/projects/{projectId}',
      'post /api/projects/{projectId}/files/init',
      'post /api/projects/{projectId}/files/{fileId}/complete',
      'get /{path}',
    ];
    const actual: string[] = [];
    const operationIds: string[] = [];
    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options',
      ] as const) {
        const operation = item?.[method];
        if (!operation) continue;
        actual.push(`${method} ${path}`);
        expect(operation.summary).toBeTruthy();
        expect(operation.tags?.length).toBeGreaterThan(0);
        expect(operation.responses['500']).toBeDefined();
        operationIds.push(operation.operationId!);
        const parameterNames = [...path.matchAll(/\{([^}]+)\}/g)].map(
          (match) => match[1],
        );
        for (const name of parameterNames) {
          expect(operation.parameters).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ name, in: 'path', required: true }),
            ]),
          );
        }
      }
    }
    expect(actual.sort()).toEqual(expected.sort());
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('resolves every local schema reference', () => {
    const visit = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === '$ref' && typeof child === 'string') {
          expect(child.startsWith('#/')).toBe(true);
          const resolved = child
            .slice(2)
            .split('/')
            .reduce<unknown>(
              (node, segment) =>
                (node as Record<string, unknown> | undefined)?.[segment],
              document,
            );
          expect(resolved).toBeDefined();
        } else {
          visit(child);
        }
      }
    };
    visit(document);
  });

  it('declares session cookie security only on guarded session operations', () => {
    expect(document.components?.securitySchemes?.session_id).toEqual(
      expect.objectContaining({
        type: 'apiKey',
        in: 'cookie',
        name: 'session_id',
      }),
    );
    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of ['get', 'post'] as const) {
        const operation = item?.[method];
        if (!operation) continue;
        if (path.startsWith('/api/projects') || path === '/api/user/profile') {
          expect(operation.security).toEqual([{ session_id: [] }]);
          expect(operation.responses['401']).toBeDefined();
        } else {
          expect(operation.security ?? []).toEqual([]);
        }
      }
    }
  });

  it('describes request constraints and the exact upload response shape', () => {
    const schemas = document.components!.schemas!;
    const register = schemas.RegisterDto as {
      required: string[];
      properties: Record<string, any>;
    };
    expect(register.required.sort()).toEqual(['email', 'password']);
    expect(register.properties.password).toEqual(
      expect.objectContaining({ minLength: 8, writeOnly: true }),
    );
    const upload = schemas.FileUploadResponseDto as { required: string[] };
    expect(upload.required.sort()).toEqual(
      ['uploadUrl', 'method', 'key', 'headers', 'expiresIn', 'fileId'].sort(),
    );
    const mimeTypes = schemas.UploadMimeType as { enum: string[] };
    expect(mimeTypes.enum).toContain('text/html');
    const detail = schemas.ProjectDetailsResponseDto as {
      properties: Record<string, any>;
    };
    expect(detail.properties.files.items.$ref).toBe(
      '#/components/schemas/FileResponseDto',
    );
    expect(
      document.paths['/api/projects/{projectId}/files/{fileId}/complete']!.post!
        .responses['403'],
    ).toBeDefined();
  });

  it('serves Swagger UI, JSON and YAML ahead of the site catch-all', async () => {
    await request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200)
      .expect(/swagger-ui/);
    const json = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(json.body.paths).toEqual(document.paths);
    await request(app.getHttpServer())
      .get('/api/docs-yaml')
      .expect(200)
      .expect(/openapi:/);
  });

  it('matches documented sign-in status, plain body, cookie and validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'developer@example.com', password: 'ExamplePass123!' })
      .expect(201)
      .expect('Ok');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/session_id=test-session-id;.*HttpOnly/),
      ]),
    );
    expect(
      document.paths['/api/auth/sign-in']!.post!.responses['201'],
    ).toBeDefined();
    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'invalid', password: 'weak', unexpected: true })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            statusCode: 400,
            message: expect.any(Array),
            error: 'Bad Request',
          }),
        );
      });
  });

  it('preserves public site root routing and 404 without X-Project-Id', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
    await request(app.getHttpServer()).get('/assets/style.css').expect(404);
    expect(document.paths['/{path}']!.get!.responses['304']).toBeDefined();
  });
});
