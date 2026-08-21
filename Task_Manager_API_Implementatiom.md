# NestJS Task Manager API — Complete Implementation Task Roadmap

## 1. Project Goal

Build a REST API that lets clients create, read, update, complete, search, filter, paginate, sort, and delete tasks. The project uses NestJS, TypeScript, PostgreSQL, TypeORM, validation, Swagger, Jest, Supertest, and Docker.

Do the tasks in order. Do not copy the finished source files before attempting each task yourself; use the attached project only as a reference when blocked or when comparing your final result.

## 2. Definition of Done

The project is complete when:

- All six API endpoints work.
- Invalid requests return `400 Bad Request`.
- Missing task IDs return `404 Not Found`.
- Task IDs are UUIDs.
- Data is stored in PostgreSQL.
- Search, filters, sorting, and pagination work together.
- `completedAt` is managed automatically.
- Swagger documents the API.
- Unit and end-to-end tests pass.
- Linting and production build pass.
- The API and databases can run with Docker.
- The README and Postman collection allow another developer to use the project.

## 3. Target API Contract

| Method | Route | Expected result |
|---|---|---|
| `POST` | `/api/tasks` | Create a task; return `201` |
| `GET` | `/api/tasks` | Return a searchable, filterable, sorted, paginated list |
| `GET` | `/api/tasks/:id` | Return one task or `404` |
| `PATCH` | `/api/tasks/:id` | Partially update a task |
| `PATCH` | `/api/tasks/:id/complete` | Mark a task completed |
| `DELETE` | `/api/tasks/:id` | Delete a task; return `204` |

## Phase 0 — Understand and Plan

### Task 0.1 — Write the requirements

- List the six endpoints above.
- List the task fields and business rules.
- Define success and error status codes.
- Decide that dates will be ISO 8601 values and stored as PostgreSQL `timestamptz`.

**Acceptance check:** You can explain what the controller, service, repository, DTO, entity, and module each do.

### Task 0.2 — Define the task model

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Generated primary key |
| `title` | string | Required, non-empty, maximum 150 characters |
| `description` | string/null | Optional |
| `status` | enum | `pending`, `in_progress`, `completed`; default `pending` |
| `priority` | enum | `low`, `medium`, `high`, `urgent`; default `medium` |
| `dueDate` | date/null | Optional |
| `completedAt` | date/null | Filled when completed; cleared if no longer completed |
| `createdAt` | date | Generated automatically |
| `updatedAt` | date | Updated automatically |

## Phase 1 — Initialize the Project

### Task 1.1 — Prepare the development environment

- Install Node.js 20 or newer, npm, Git, and Docker Desktop.
- Confirm: `node --version`, `npm --version`, `docker --version`.

### Task 1.2 — Generate the NestJS application

```bash
npm i -g @nestjs/cli
nest new task-manager-api
cd task-manager-api
```

- Select npm.
- Run the generated application with `npm run start:dev`.
- Confirm the server starts before adding features.

### Task 1.3 — Install dependencies

Install packages for configuration, TypeORM, PostgreSQL, validation, transformation, and Swagger:

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/swagger
```

Confirm Jest, Supertest, ESLint, Prettier, and Nest testing packages are available as development dependencies.

### Task 1.4 — Clean and organize the starter

- Remove unused starter controller/service files and their tests.
- Create `src/tasks/dto`, `src/tasks/entities`, `src/tasks/enums`, and `src/common/interfaces`.
- Keep `src/main.ts` and `src/app.module.ts`.

**Checkpoint:** `npm run build` passes.

## Phase 2 — Environment and PostgreSQL

### Task 2.1 — Add environment templates

Create `.env.example` with:

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

Create `.env.test.example` using port `5433` and database `task_manager_test`. Copy `.env.example` to `.env`, and make sure `.env` is ignored by Git.

### Task 2.2 — Create Docker Compose databases

- Add a PostgreSQL 17 Alpine development service on host port `5432`.
- Add a separate test database on host port `5433`.
- Use a named volume for development data.
- Use temporary storage for test data.
- Add `pg_isready` health checks.

Start development PostgreSQL:

```bash
docker compose up -d postgres
docker compose ps
```

### Task 2.3 — Configure TypeORM

In `AppModule`:

- Load `ConfigModule` globally.
- Use `TypeOrmModule.forRootAsync` and `ConfigService`.
- Read every database value from environment variables.
- Enable `autoLoadEntities`.
- Convert `DB_SYNCHRONIZE` and `DB_LOGGING` strings to booleans.
- Import `TasksModule` after creating it.

**Acceptance check:** The API connects to PostgreSQL without hard-coded credentials.

## Phase 3 — Domain Model and Database Entity

### Task 3.1 — Create enums

- Create `TaskStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED` with lowercase stored values.
- Create `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT` with lowercase stored values.

### Task 3.2 — Create the TypeORM entity

- Map the entity to the `tasks` table.
- Use a generated UUID primary key.
- Add all fields from the model table.
- Use enum columns and their defaults.
- Use nullable `timestamptz` columns for `dueDate` and `completedAt`.
- Use `CreateDateColumn` and `UpdateDateColumn`.
- Add indexes for `status`, `priority`, and `dueDate`.

### Task 3.3 — Register the feature module

- Generate a tasks module, service, and controller.
- Register `Task` using `TypeOrmModule.forFeature([Task])`.
- Provide the service and declare the controller.

**Checkpoint:** Start the app and confirm PostgreSQL contains a `tasks` table.

## Phase 4 — DTOs and Validation

### Task 4.1 — Build `CreateTaskDto`

- Validate `title` as a non-empty string with maximum length 150.
- Make `description`, `status`, `priority`, and `dueDate` optional.
- Validate enum fields with `IsEnum`.
- Validate `dueDate` with `IsDateString`.
- Add Swagger property metadata and examples.

### Task 4.2 — Build `UpdateTaskDto`

- Derive it from `CreateTaskDto` using Swagger `PartialType`.
- Ensure every property is optional while retaining validation rules.

### Task 4.3 — Build `QueryTasksDto`

Support:

- `status` and `priority` filters.
- Case-insensitive `search` text.
- `dueAfter` and `dueBefore` ISO dates.
- `page`, default 1 and minimum 1.
- `limit`, default 10, minimum 1 and maximum 100.
- `sortBy`: only `createdAt`, `updatedAt`, `dueDate`, `title`, or `priority`.
- `order`: only `ASC` or `DESC`, default `DESC`.
- Numeric transformation for `page` and `limit`.

### Task 4.4 — Enable global validation

In `main.ts`, add `ValidationPipe` with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- implicit conversion enabled

Also set the global prefix to `api` and enable CORS.

**Acceptance checks:** Empty titles, unknown properties, invalid enums, invalid UUIDs, bad dates, `page=0`, and `limit=101` are rejected.

## Phase 5 — Service and Business Logic

### Task 5.1 — Inject the repository

- Inject `Repository<Task>` with `@InjectRepository(Task)`.
- Keep database work in the service, not the controller.

### Task 5.2 — Implement creation

- Convert a supplied `dueDate` string to `Date`; otherwise store `null`.
- If a task is initially completed, set `completedAt` to now.
- Create and save the entity.

### Task 5.3 — Implement find-one

- Find by UUID.
- If absent, throw `NotFoundException` with a useful message.
- Reuse this method in update, complete, and delete operations.

### Task 5.4 — Implement listing with QueryBuilder

- Apply optional status and priority conditions.
- Search both title and description with PostgreSQL `ILIKE`.
- Apply due-date lower and upper bounds.
- Use only validated sort fields to avoid unsafe dynamic SQL.
- Add a stable secondary order when sorting by due date.
- Apply `skip` and `take` for pagination.
- Retrieve rows and total count together.

Create a generic paginated response interface and return:

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

### Task 5.5 — Implement partial update

- Load the existing task first.
- Merge only supplied fields.
- Convert a supplied due date to `Date`.
- When the next status becomes completed, set `completedAt` if missing.
- When the next status is not completed, clear `completedAt`.
- Save and return the updated task.

### Task 5.6 — Implement complete

- Load the task.
- If already completed, return it unchanged so the operation is idempotent.
- Otherwise set status to completed and `completedAt` to now, then save.

### Task 5.7 — Implement deletion

- Load the task so a missing record returns `404`.
- Remove it and return no body.

**Checkpoint:** Write temporary service-level checks or unit tests before connecting routes.

## Phase 6 — REST Controller

### Task 6.1 — Implement all routes

- Map controller methods to the target API contract.
- Use `@Body()` for DTOs and `@Query()` for list queries.
- Validate every route ID with `ParseUUIDPipe`.
- Set deletion to `204 No Content`.
- Keep controllers thin: delegate work to `TasksService`.

### Task 6.2 — Manually test the CRUD lifecycle

1. Create a task.
2. List tasks.
3. Read the created task by UUID.
4. Update its title, status, and priority.
5. Mark it completed.
6. Confirm `completedAt` exists.
7. Delete it.
8. Confirm a later read returns `404`.

## Phase 7 — Swagger Documentation

### Task 7.1 — Configure Swagger

- Build an OpenAPI document in `main.ts`.
- Set title, description, version, and `tasks` tag.
- Serve Swagger UI at `/docs`.

### Task 7.2 — Document endpoints and schemas

- Add `ApiTags` and `ApiOperation`.
- Add success response descriptions and entity response types.
- Document `404` where applicable and `204` for deletion.
- Add examples and optional markers to DTO fields.

**Acceptance check:** Open `http://localhost:3000/docs` and execute every endpoint successfully.

## Phase 8 — Automated Testing

### Task 8.1 — Unit-test `TasksService`

- Create a repository mock factory.
- Provide it through `getRepositoryToken(Task)`.
- Test at minimum:
  - create calls `create` and `save`;
  - find-one throws `NotFoundException` when absent;
  - complete sets status and timestamp;
  - completing an already completed task is idempotent;
  - update clears or creates `completedAt` correctly;
  - delete removes an existing task;
  - list builds filters and pagination correctly.

Run:

```bash
npm test
npm run test:cov
```

### Task 8.2 — Prepare the e2e database

```bash
docker compose up -d postgres-test
```

- Configure test database port `5433`.
- Enable schema synchronization only for this learning test environment.
- Clear the repository before each test.
- Close the Nest application after the suite.

### Task 8.3 — Write end-to-end tests

Use Supertest for a full lifecycle:

- create → read → update → complete → filter/search/paginate → delete → confirm `404`;
- verify a malformed body returns `400`;
- add invalid UUID, missing task, invalid query, and pagination-boundary tests.

Run:

```bash
npm run test:e2e
```

## Phase 9 — Quality and Security Checks

### Task 9.1 — Run static checks

```bash
npm run format
npm run lint
npm run build
```

Fix errors rather than suppressing them.

### Task 9.2 — Review API safety

- Confirm unknown request properties are rejected.
- Confirm sorting uses a strict allowlist.
- Confirm pagination is capped at 100.
- Confirm credentials are not committed.
- Confirm database errors do not expose secrets.
- Review CORS policy before production; do not leave unrestricted CORS unintentionally.

### Task 9.3 — Replace synchronization with migrations for production

- Set `DB_SYNCHRONIZE=false` outside local learning environments.
- Add a TypeORM data-source configuration.
- Generate, inspect, and run an initial migration.
- Test migrating an empty database and rolling back safely.

## Phase 10 — Containerization

### Task 10.1 — Create a multi-stage Dockerfile

- Build with a Node Alpine image.
- Run `npm ci` and `npm run build` in the build stage.
- Install only production dependencies in the final stage.
- Copy `dist`, expose port 3000, and run `node dist/main`.

### Task 10.2 — Add `.dockerignore`

Exclude at least `node_modules`, `dist`, coverage output, Git files, and local environment files.

### Task 10.3 — Test the image

```bash
docker build -t task-manager-api .
docker run --rm -p 3000:3000 --env-file .env task-manager-api
```

If the database is another container, use a Compose service name as `DB_HOST`, not `localhost`.

## Phase 11 — Developer Documentation

### Task 11.1 — Complete the README

Include:

- Project purpose and practiced concepts.
- Tech stack and structure.
- Prerequisites and installation.
- Environment variable table.
- Database startup instructions.
- Endpoint table and request/response examples.
- Query parameter examples.
- Test, lint, build, and Docker commands.
- Production warning about `synchronize`.
- Troubleshooting for occupied ports and database connection errors.

### Task 11.2 — Create a Postman collection

- Add one request for every endpoint.
- Add list examples using filters, search, dates, sorting, and pagination.
- Store base URL and task ID as collection variables.
- Add one invalid request to demonstrate validation.

## Phase 12 — Final Verification and Delivery

### Task 12.1 — Run the final verification sequence

```bash
docker compose up -d postgres postgres-test
npm ci
npm run format
npm run lint
npm test
npm run test:e2e
npm run test:cov
npm run build
```

Then manually verify `/docs` and the Postman collection.

### Task 12.2 — Review the repository

- No `.env`, credentials, `node_modules`, coverage, or generated build output is committed.
- `.env.example` and `.env.test.example` contain placeholders only.
- The project starts from a clean clone using documented commands.
- Tests do not depend on development database data.
- API responses and error codes match the documented contract.

### Task 12.3 — Prepare delivery

- Commit in meaningful groups, such as setup, database, tasks CRUD, queries, docs, tests, and Docker.
- Tag the finished version as `v1.0.0`.
- Share the repository with setup instructions and the Postman collection.

## 4. Recommended Learning Schedule

| Day | Work |
|---|---|
| 1 | Phases 0–2: requirements, Nest setup, PostgreSQL, configuration |
| 2 | Phases 3–4: entity, enums, DTOs, validation |
| 3 | Phase 5: service CRUD and business rules |
| 4 | Phases 5–6: queries, pagination, controller, manual testing |
| 5 | Phase 7 and unit tests |
| 6 | E2E tests and quality/security review |
| 7 | Docker, documentation, clean-clone verification, delivery |

## 5. Progress Checklist

- [ ] Phase 0 — Requirements understood
- [ ] Phase 1 — NestJS project initialized
- [ ] Phase 2 — PostgreSQL and environment configured
- [ ] Phase 3 — Task entity and feature module complete
- [ ] Phase 4 — DTO validation complete
- [ ] Phase 5 — Service and business logic complete
- [ ] Phase 6 — REST endpoints complete
- [ ] Phase 7 — Swagger complete
- [ ] Phase 8 — Unit and e2e tests pass
- [ ] Phase 9 — Quality and security checks pass
- [ ] Phase 10 — Docker image works
- [ ] Phase 11 — README and Postman collection complete
- [ ] Phase 12 — Final verification and delivery complete

## 6. Optional Version 2 Tasks

Only begin these after v1.0.0 is complete:

- User registration, login, JWT authentication, and task ownership.
- Roles and authorization guards.
- Database migrations and seed data.
- Soft deletion and audit history.
- Recurring tasks, tags, and reminders.
- Rate limiting, structured logging, and health checks.
- CI pipeline for lint, tests, build, and image scanning.
- Deployment with managed PostgreSQL, HTTPS, secret management, monitoring, and backups.

