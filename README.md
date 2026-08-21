# Task Manager API — NestJS + PostgreSQL + TypeORM

A complete learning project for practicing the NestJS backend concepts 

## What You Practice

- Modules
- Controllers
- Services
- DTOs
- Validation Pipes
- Dependency Injection
- TypeORM
- PostgreSQL
- CRUD operations
- Filtering
- Search
- Pagination
- Sorting
- Swagger/OpenAPI
- Unit testing
- End-to-end testing
- Docker Compose

## Features

- Create tasks
- Get all tasks
- Get one task
- Update tasks
- Delete tasks
- Mark tasks as completed
- Task priorities
- Due dates
- Filter by status
- Filter by priority
- Filter by due-date range
- Case-insensitive search by title or description
- Pagination
- Sorting
- Automatic `completedAt` tracking
- UUID validation
- Request-body validation
- Swagger API documentation

## Tech Stack

- NestJS 11
- TypeScript
- PostgreSQL
- TypeORM
- class-validator
- class-transformer
- Swagger
- Jest + Supertest
- Docker Compose

## Project Structure

```text
task-manager-api/
├── src/
│   ├── common/
│   │   └── interfaces/
│   │       └── paginated-response.interface.ts
│   ├── tasks/
│   │   ├── dto/
│   │   │   ├── create-task.dto.ts
│   │   │   ├── query-tasks.dto.ts
│   │   │   └── update-task.dto.ts
│   │   ├── entities/
│   │   │   └── task.entity.ts
│   │   ├── enums/
│   │   │   ├── task-priority.enum.ts
│   │   │   └── task-status.enum.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.module.ts
│   │   ├── tasks.service.spec.ts
│   │   └── tasks.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env.example
├── .env.test.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Task Model

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | string | Required, max 150 chars |
| `description` | string/null | Optional description |
| `status` | enum | `pending`, `in_progress`, `completed` |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `dueDate` | date/null | Optional due date |
| `completedAt` | date/null | Filled when completed |
| `createdAt` | date | Automatically generated |
| `updatedAt` | date | Automatically updated |

## 1. Requirements

Install:

- Node.js 20+
- npm
- Docker Desktop, or a local PostgreSQL server

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Copy the example file:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS/Linux

```bash
cp .env.example .env
```

Default configuration:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=task_manager
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

> `DB_SYNCHRONIZE=true` is convenient for this learning project. In a real production application, set it to `false` and manage schema changes with migrations.

## 4. Start PostgreSQL

The easiest option is Docker Compose:

```bash
docker compose up -d postgres
```

This starts PostgreSQL at `localhost:5432` and creates the `task_manager` database.

## 5. Start the API

Development mode:

```bash
npm run start:dev
```

API base URL:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/docs
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List/search/filter/paginate tasks |
| GET | `/api/tasks/:id` | Get one task |
| PATCH | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/complete` | Mark task completed |
| DELETE | `/api/tasks/:id` | Delete task |

## Create a Task

```http
POST /api/tasks
Content-Type: application/json
```

```json
{
  "title": "Learn NestJS DTO validation",
  "description": "Build the first Task Manager project",
  "priority": "high",
  "dueDate": "2026-08-20T18:00:00.000Z"
}
```

Example response:

```json
{
  "id": "1e2e1431-2575-4dda-832f-d428047ec52d",
  "title": "Learn NestJS DTO validation",
  "description": "Build the first Task Manager project",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-20T18:00:00.000Z",
  "completedAt": null,
  "createdAt": "2026-08-13T19:00:00.000Z",
  "updatedAt": "2026-08-13T19:00:00.000Z"
}
```

## Update a Task

```http
PATCH /api/tasks/:id
Content-Type: application/json
```

```json
{
  "title": "Finish NestJS Task Manager",
  "status": "in_progress",
  "priority": "urgent"
}
```

All fields are optional for update requests.

## Mark a Task as Completed

```http
PATCH /api/tasks/:id/complete
```

This changes:

```text
status       -> completed
completedAt  -> current timestamp
```

## Search, Filtering, Pagination, and Sorting

Example:

```http
GET /api/tasks?status=pending&priority=high&search=nestjs&page=1&limit=10&sortBy=createdAt&order=DESC
```

### Available Query Parameters

| Parameter | Example | Purpose |
|---|---|---|
| `status` | `pending` | Filter status |
| `priority` | `high` | Filter priority |
| `search` | `nestjs` | Search title/description |
| `dueAfter` | ISO date | Tasks due after date |
| `dueBefore` | ISO date | Tasks due before date |
| `page` | `1` | Page number |
| `limit` | `10` | Items per page, max 100 |
| `sortBy` | `createdAt` | Sort field |
| `order` | `DESC` | `ASC` or `DESC` |

Valid `sortBy` values:

```text
createdAt
updatedAt
dueDate
title
priority
```

### Pagination Response

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Validation Examples

These requests return HTTP `400 Bad Request`:

```json
{
  "title": ""
}
```

```json
{
  "title": "Example",
  "priority": "super-high"
}
```

The global `ValidationPipe` also rejects unexpected fields because `forbidNonWhitelisted` is enabled.

## Run Unit Tests

```bash
npm test
```

Coverage:

```bash
npm run test:cov
```

## Run End-to-End Tests

Start the test PostgreSQL container:

```bash
docker compose up -d postgres-test
```

Then run:

```bash
npm run test:e2e
```

The E2E suite uses PostgreSQL on port `5433` by default and exercises the full API lifecycle:

```text
Create
  -> Read
  -> Update
  -> Complete
  -> Filter/Search/Paginate
  -> Delete
```

## Useful cURL Commands

### Create

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Study NestJS","priority":"high"}'
```

### List

```bash
curl "http://localhost:3000/api/tasks?page=1&limit=10"
```

### Search

```bash
curl "http://localhost:3000/api/tasks?search=nestjs"
```

### Filter

```bash
curl "http://localhost:3000/api/tasks?status=pending&priority=high"
```

### Complete

```bash
curl -X PATCH http://localhost:3000/api/tasks/TASK_UUID/complete
```

### Delete

```bash
curl -X DELETE http://localhost:3000/api/tasks/TASK_UUID
```

## How NestJS Concepts Are Used

### Module

`TasksModule` groups the task controller, service, repository/entity registration, and exports.

### Controller

`TasksController` receives HTTP requests and delegates business logic to the service.

### Service

`TasksService` contains application/business logic and communicates with PostgreSQL through the TypeORM repository.

### DTOs

- `CreateTaskDto`: validates task creation.
- `UpdateTaskDto`: creates a partial version of the create DTO.
- `QueryTasksDto`: validates filtering, search, pagination, and sorting inputs.

### Validation Pipe

The global ValidationPipe transforms query strings to the expected DTO types, strips invalid properties, and rejects unknown fields.

### Dependency Injection

Nest injects `TasksService` into the controller and the TypeORM `Repository<Task>` into the service.

### TypeORM

TypeORM maps the `Task` class to PostgreSQL's `tasks` table and provides repository/query-builder APIs.

### CRUD

```text
Create -> POST
Read   -> GET
Update -> PATCH
Delete -> DELETE
```

## Recommended Learning Exercise

Do not only run the completed project. Study it in this order:

1. `task.entity.ts`
2. `create-task.dto.ts`
3. `query-tasks.dto.ts`
4. `tasks.module.ts`
5. `tasks.controller.ts`
6. `tasks.service.ts`
7. `app.module.ts`
8. `main.ts`
9. `tasks.service.spec.ts`
10. `app.e2e-spec.ts`

Then try adding these features yourself:

- Task categories
- Tags
- Soft delete
- Overdue-task endpoint
- Statistics endpoint
- User authentication
- Per-user tasks
- Database migrations
- Redis caching

## Production Note

This project intentionally uses TypeORM `synchronize` as an optional environment setting to make local learning easy. Do not rely on automatic schema synchronization for a production database. Use migrations when the schema needs controlled production changes.
