import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Task } from '../src/tasks/entities/task.entity';
import { TaskPriority } from '../src/tasks/enums/task-priority.enum';
import { TaskStatus } from '../src/tasks/enums/task-status.enum';

describe('Task Manager API (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<Task>;

  beforeAll(async () => {
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5433';
    process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
    process.env.DB_DATABASE = process.env.DB_DATABASE ?? 'task_manager_test';
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.DB_LOGGING = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    repository = moduleFixture.get<Repository<Task>>(getRepositoryToken(Task));
  });

  beforeEach(async () => {
    await repository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, reads, updates, completes, filters, searches, paginates, and deletes a task', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: 'Build Task Manager API',
        description: 'Practice NestJS and PostgreSQL',
        priority: TaskPriority.HIGH,
        dueDate: '2026-08-20T18:00:00.000Z',
      })
      .expect(201);

    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.status).toBe(TaskStatus.PENDING);
    const taskId: string = createResponse.body.id;

    await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Build Task Manager API');
      });

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .send({ title: 'Build Complete Task Manager API' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Build Complete Task Manager API');
      });

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}/complete`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(TaskStatus.COMPLETED);
        expect(body.completedAt).toBeTruthy();
      });

    await request(app.getHttpServer())
      .get('/api/tasks')
      .query({
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        search: 'Complete Task',
        page: 1,
        limit: 5,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.meta.page).toBe(1);
        expect(body.meta.limit).toBe(5);
        expect(body.meta.totalItems).toBe(1);
      });

    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .expect(204);

    await request(app.getHttpServer()).get(`/api/tasks/${taskId}`).expect(404);
  });

  it('rejects invalid input through the global ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: '', priority: 'impossible-priority', unexpected: true })
      .expect(400);
  });
});
