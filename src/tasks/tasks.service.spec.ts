import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskStatus } from './enums/task-status.enum';
import { TasksService } from './tasks.service';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  findOneBy: jest.Mock;
  merge: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const repositoryMockFactory = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(getRepositoryToken(Task));
  });

  it('creates and saves a task', async () => {
    const dto: CreateTaskDto = {
      title: 'Learn NestJS',
      priority: TaskPriority.HIGH,
    };
    const entity = {
      id: '11111111-1111-4111-8111-111111111111',
      title: dto.title,
      description: null,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      dueDate: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;

    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toEqual(entity);
    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('throws NotFoundException when a task does not exist', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne('11111111-1111-4111-8111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks an existing task as completed', async () => {
    const task = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Finish API',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      description: null,
      dueDate: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;

    repository.findOneBy.mockResolvedValue(task);
    repository.save.mockImplementation(async (value: Task) => value);

    const result = await service.complete(task.id);

    expect(result.status).toBe(TaskStatus.COMPLETED);
    expect(result.completedAt).toBeInstanceOf(Date);
  });
});
