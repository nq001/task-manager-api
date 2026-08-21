import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : null,
      completedAt:
        createTaskDto.status === TaskStatus.COMPLETED ? new Date() : null,
    });

    return this.tasksRepository.save(task);
  }

  async findAll(query: QueryTasksDto): Promise<PaginatedResponse<Task>> {
    const {
      status,
      priority,
      search,
      dueAfter,
      dueBefore,
      page,
      limit,
      sortBy,
      order,
    } = query;

    const qb = this.tasksRepository.createQueryBuilder('task');

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }

    if (search?.trim()) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (dueAfter) {
      qb.andWhere('task.dueDate >= :dueAfter', {
        dueAfter: new Date(dueAfter),
      });
    }

    if (dueBefore) {
      qb.andWhere('task.dueDate <= :dueBefore', {
        dueBefore: new Date(dueBefore),
      });
    }

    qb.orderBy(`task.${sortBy}`, order);

    if (sortBy === 'dueDate') {
      qb.addOrderBy('task.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" was not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    const nextStatus = updateTaskDto.status ?? task.status;

    this.tasksRepository.merge(task, {
      ...updateTaskDto,
      dueDate:
        updateTaskDto.dueDate !== undefined
          ? new Date(updateTaskDto.dueDate)
          : task.dueDate,
      completedAt:
        nextStatus === TaskStatus.COMPLETED
          ? task.completedAt ?? new Date()
          : null,
    });

    return this.tasksRepository.save(task);
  }

  async complete(id: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.status === TaskStatus.COMPLETED) {
      return task;
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();

    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
