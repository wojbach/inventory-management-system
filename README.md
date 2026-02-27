# Inventory Management System

A backend application for an Inventory Management System, utilizing CQRS and MongoDB transactions.

## ADR: Framework Choice

**Context:** The requirements state: "Use Node.js and Express.js to build the API".
**Decision:** We chose **NestJS**.
**Justification:** NestJS uses Express.js under the hood. It perfectly fits our needs for CQRS and a solid, enterprise-like architecture. It has a ready-to-use `@nestjs/cqrs` module. Building a custom CQRS system on pure Express.js takes too much time. NestJS gives us a production-tested solution while still relying on the Express.js ecosystem.

## ADR: MongoDB Transactions vs. Sagas

**Context:** When a user buys a product, we must do two things at once: deduct stock and create an order. Both must succeed together, or both must fail.
**Decision:** We use **MongoDB Multi-Document Transactions** instead of the Saga pattern. We run a single-node Replica Set in Docker to allow this locally.
**Justification:** Sagas (saving an order, sending an event, and writing rollback code if stock is empty) are complex and cause temporary data inconsistencies. Instead, MongoDB ACID transactions offer:

1. **Simplicity:** We don't need extra tools like RabbitMQ or tricky rollback code.
2. **Strong Consistency:** Either everything saves, or nothing does.
   _Note:_ MongoDB requires a Replica Set for transactions to work. We set up a 1-node replica set in Docker to support transactions locally.
   **Cloud Availability:** This setup works perfectly with managed cloud databases (MongoDB Atlas, AWS DocumentDB, Azure Cosmos DB), as they all support these transactions out of the box.

## ADR: Unit of Work (UoW) Pattern

**Context:** Although MongoDB provides transactions, managing `ClientSession` objects directly inside Command Handlers tightly couples our business logic to the database technology.
**Decision:** We implemented the **Unit of Work (UoW)** pattern to abstract database transactions. Command Handlers execute their operations inside a `withTransaction` block provided by an injected `IUnitOfWork`, keeping infrastructure details hidden.
**Justification:** This decouples our application core from MongoDB specifics. It allows us to orchestrate multi-aggregate changes (e.g., deducting stock and creating an order) cleanly and improves the testability of our handlers.

## ADR: Floating Point Precision for Money

**Context:** Prices and money require exact calculations (for example, applying percentage discounts or region multipliers). JavaScript uses floating-point numbers by default. This means that a simple calculation like `0.1 + 0.2` gives `0.30000000000000004` instead of exactly `0.3`. If we do not fix this, our financial calculations will be wrong.
**Decision:** We use the [**big.js**](https://github.com/MikeMcl/big.js) library. We hide all money-related math inside our services using this library. The library makes sure the math is perfectly accurate before we round the final result and return it as a regular number.
**Justification:** Writing our own logic to fix floating-point math errors is hard and risky. The `big.js` package is a small and proven library that handles decimal math perfectly. It completely removes the risk of returning incorrect prices from our API.

## ADR: Integration Testing Database

**Context:** We need a real MongoDB database to run Integration Tests. This allows us to test real queries, Mongoose validations, and transactions correctly, without the need to mock our database code.
**Decision:** We chose to use the **mongodb-memory-server** package instead of **[Testcontainers](https://testcontainers.com/)**. It automatically starts a temporary, in-memory database right inside our Node.js tests.
**Justification:** [Testcontainers](https://testcontainers.com/) is an amazing tool for managing real databases in Docker, but it is too complex for this stage of the project. It requires Docker to be running on your computer, which makes local testing slower and complicates the CI (Continuous Integration) setup. On the other hand, `mongodb-memory-server` is much simpler right now: it downloads the MongoDB engine and runs it directly in the computer's memory in less than a second. It gives us all the benefits of a real database, but keeps our tests very fast and does not require Docker.

## Prerequisites

- **Node.js** >= 24 LTS Krypton (see `.nvmrc` — run `nvm use` to switch automatically)
- **Yarn** (v1 classic)
- **Docker** — required to run the local MongoDB replica set
- **[nvm](https://github.com/nvm-sh/nvm)** _(optional)_ — recommended for managing Node.js versions

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

This will also automatically set up Git hooks via Husky (see [Git Hooks](#git-hooks) below).

### 2. Configure Environment Variables

Before running the application, you need to set up your environment variables. Copy the provided sample template:

```bash
cp .env.example .env
```

You can then edit `.env` if you need to change any default settings.

### 3. Run the application

First, you need to start the MongoDB database. The project includes a `docker-compose.yml` file that creates a single-node MongoDB Replica Set (required for testing transactions locally) and a Mongo Express dashboard.

```bash
# Start the database in the background
docker compose up -d
```

Once the database is running, you can start the NestJS application:

```bash
# Development (watch mode — auto-restarts on file changes)
yarn start:dev
```

The application will start on `http://localhost:3000` by default.
You can view your database via the Mongo Express dashboard at `http://localhost:8081` (Login: `admin` / Password: `pass`).

### 4. Run tests

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:cov

# Integration tests
yarn test:int
```

### 5. Docker & CI

The application includes a multi-stage `Dockerfile`. For Continuous Integration (CI), you can build the intermediate `builder` stage and run your test suite inside it before continuing to build the lean production image.

**GitHub Actions:**
We have an automated pipeline (`.github/workflows/ci.yml`) set up that uses this exact Docker-in-Docker pattern. Whenever code is pushed to the `main` branch, the pipeline will build the `builder` image, run formatters, linters, and all integration tests completely isolated inside that container, and finally output the production-ready image upon success.

You can simulate exactly what CI does on your local machine:

```bash
# 1. Build only the builder stage for testing
docker build --target builder -t inventory-management-system-builder .

# 2. Run tests in the builder environment
docker run --rm inventory-management-system-builder yarn test
docker run --rm inventory-management-system-builder yarn test:int

# 3. If tests pass, build the final production image
docker build -t inventory-management-system .
```

## Code Quality

### Linting & Formatting

This project uses **ESLint** for linting and **Prettier** for code formatting. Both are configured to work together without conflicts.

```bash
# Run ESLint with auto-fix
yarn lint

# Run Prettier on all source files
yarn format
```

### Git Hooks

The project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to enforce code quality automatically via Git hooks:

| Hook           | What runs                                               | Purpose                                                           |
| -------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| **pre-commit** | `lint-staged` (ESLint + Prettier on staged `.ts` files) | Ensures all committed code is linted and formatted                |
| **pre-push**   | `yarn test` & `yarn test:int`                           | Ensures all unit and integration tests pass before code is pushed |

#### How it works

1. **`yarn install`** triggers the `prepare` script, which runs `husky`
2. Husky sets Git's `core.hooksPath` to the `.husky/` directory
3. When you `git commit`, Git executes `.husky/pre-commit` → runs `lint-staged`
   - `lint-staged` runs ESLint and Prettier **only on staged files**, and automatically re-stages any fixes
4. When you `git push`, Git executes `.husky/pre-push` → runs `yarn test` and `yarn test:int`
   - If any test fails, the push is **blocked**

> **Note:** If you need to bypass hooks in an emergency, you can use `git commit --no-verify` or `git push --no-verify`, but this is discouraged.

## VS Code Setup

### Recommended Extensions

When you open this project in VS Code, you'll be prompted to install the recommended extensions. You can also install them manually:

| Extension                     | ID                       | Purpose                                       |
| ----------------------------- | ------------------------ | --------------------------------------------- |
| **Prettier - Code formatter** | `esbenp.prettier-vscode` | Formats code on save                          |
| **ESLint**                    | `dbaeumer.vscode-eslint` | Highlights and auto-fixes lint errors on save |

### On-Save Behavior

The workspace is pre-configured (`.vscode/settings.json`) so that every time you save a file:

1. **Prettier** formats the file automatically
2. **ESLint** auto-fixes any fixable issues

No manual formatting needed — just save and it's done.

### Run & Debug Configurations

Available from the **Run and Debug** panel (`⌘⇧D` / `Ctrl+Shift+D`):

| Configuration | Description                                   |
| ------------- | --------------------------------------------- |
| **Start Dev** | Starts the app in watch mode with live reload |
| **Test**      | Runs the full test suite                      |

### Tasks

Available from **Terminal → Run Task** (`⌘⇧P` → `Tasks: Run Task`):

| Task       | Description                       |
| ---------- | --------------------------------- |
| **Format** | Runs Prettier on all source files |
| **Lint**   | Runs ESLint with auto-fix         |

## Available Scripts

| Script             | Command                      | Description             |
| ------------------ | ---------------------------- | ----------------------- |
| `yarn build`       | `nest build`                 | Build the project       |
| `yarn start`       | `nest start`                 | Start the application   |
| `yarn start:dev`   | `nest start --watch`         | Start in watch mode     |
| `yarn start:debug` | `nest start --debug --watch` | Start in debug mode     |
| `yarn start:prod`  | `node dist/main`             | Start production build  |
| `yarn lint`        | `eslint --fix`               | Lint and auto-fix       |
| `yarn format`      | `prettier --write`           | Format all source files |
| `yarn test`        | `jest`                       | Run unit tests          |
| `yarn test:watch`  | `jest --watch`               | Run tests in watch mode |
| `yarn test:cov`    | `jest --coverage`            | Run tests with coverage |
| `yarn test:int`    | `jest (int config)`          | Run integration tests   |

## Testing Strategy

The application uses two levels of automated testing:

### 1. Unit Tests

Unit tests check specific parts of the code in isolation, like classes, functions, handlers, and Domain Aggregates.

- **Organization:** Unit test files are located next to the files they test. They end with the `.spec.ts` suffix (for example, `create-order.handler.spec.ts`).
- **Tools:** We use **Jest** to run tests and make assertions. We use Jest to mock dependencies like repositories or external services. We test Command and Query handlers in isolation, without starting the whole NestJS application.
- **Command:** `yarn test`

### 2. Integration Tests

Integration tests make sure that different modules, controllers, dependencies, and the database work correctly together.

- **Organization:** These tests are inside the `test/` directory at the root level. They end with the `.int-spec.ts` suffix (for example, `orders.int-spec.ts`).
- **Tools:** We use **Jest**, **Supertest** (for HTTP requests), and the **NestJS Testing Module**. These tests start a local NestJS application instance that connects to the development MongoDB Replica Set. This lets us test the full HTTP request process, global pipes (like ValidationPipe), and real database transactions.
- **Why Integration and not E2E?** These are Integration Tests, not true End-to-End (E2E) tests. This is because they start the application directly from code and use a shared developer database. True E2E tests would test the app from the outside and use a completely fresh, isolated database for every run (for example, using Testcontainers).
- **Command:** `yarn test:int`

## Module Architecture (CQRS)

This application uses the **Command Query Responsibility Segregation (CQRS)** pattern. Each feature (like Inventory or Orders) has its own NestJS Module. A typical module includes the following parts:

1. **Controllers:** They handle HTTP endpoints (for example, `orders.controller.ts`). They are very small. Their only job is to receive the HTTP request and send a Command or a Query to the correct bus.
2. **Commands & Queries (`commands/`, `queries/`):**
   - They define the data structure for an action (for example, `impl/create-order.command.ts`).
   - **Handlers** (`handlers/create-order.handler.ts`) contain the main business logic. They validate data and interact with repositories and other services.
3. **Events (`events/`):**
   - Aggregate Roots (like `Order`) create domain events (`impl/order-created.event.ts`) when their internal state changes successfully.
   - **Event Handlers** (`handlers/order-events.handler.ts`) listen to these events. They perform background tasks like logging, sending emails, or connecting to other modules.
4. **Models & Domain (`models/`):** This folder contains Mongoose Schemas (`order.schema.ts`) and CQRS Aggregate Roots (`order.aggregate.ts`). Aggregates hold validation rules and logic to change the state safely. They throw specific **Domain Exceptions** (extending a common architectural base class) to reliably indicate business rule violations without HTTP-specific logic.
5. **Repositories (`repositories/`):** They handle data access. To strictly enforce CQRS, we separate read and write concerns:
   - **Write Repositories:** Handle creating, updating, and deleting domain aggregates.
   - **Read Repositories:** Handle queries and return read-models (DTOs), optimized for fast reads.
     Both use abstract interfaces (for example, `order-repository.interface.ts` or `order-read-repository.interface.ts`) to decouple the business logic from underlying database technology (like `impl/mongo-order.repository.ts`).
6. **Module Definition (`*.module.ts`):** The main file that connects everything. It registers all Controllers, Services, Repositories, and lists of `CommandHandlers`, `QueryHandlers`, and `EventHandlers`.

## Security (Helmet & CORS)

This API is designed to operate in a cloud environment where external frontends (e.g., `admin.domain.com`) communicate with it.

To satisfy this, we use `helmet` with custom configurations intentionally optimized for APIs rather than HTML frontends:

- **`crossOriginResourcePolicy: 'cross-origin'`**: Allows external trusted frontends to process the JSON payloads returned by this API.
- **`crossOriginOpenerPolicy: 'same-origin'`**: Protects the API execution context by isolating it if opened via popups (`window.open`).
- **`contentSecurityPolicy: false`**: CSP is disabled since this backend only returns JSON data, not HTML/User Interfaces.
- **`frameguard: { action: 'deny' }`**: Explicitly blocks Clickjacking (nobody can embed this API inside an `<iframe>`).
- **CORS (`app.enableCors()`)**: Required so that the external frontend preflight requests (`OPTIONS`) pass successfully. The specific `origin` needs to be defined dynamically via the `CORS_ORIGIN` environment variable (which accepts a wildcard `*` or a comma-separated list of valid web URLs).

## Configuration Management

For maintainability and troubleshooting, **no environment variables should be accessed directly via `process.env` or NestJS `ConfigService`** throughout the codebase.

Instead, any configuration variable should be accessed **only** via the `AppConfigService` (`src/common/config/app-config.service.ts`).

### Environment Validation

Every new environment variable must be validated ensuring application safety on startup. We use the `EnvironmentVariables` class (`src/common/config/environement-variables.model.ts`) in conjunction with `class-validator` and `class-transformer` for this purpose.

To add a new variable, define it in the `EnvironmentVariables` class with appropriate validation decorators:

```typescript
// src/common/config/environement-variables.model.ts
import { IsString, IsNotEmpty } from 'class-validator';

class EnvironmentVariables {
  // ... existing variables

  @IsString()
  @IsNotEmpty()
  API_KEY: string;
}
```

### Configuration Logging & Sensitive Data

The application prints the applied configuration on startup. Any sensitive data (such as passwords, secrets, or API keys) must be obfuscated in the logs.

To add and obfuscate a new sensitive configuration variable, use the `sensitive: true` flag in the `getConfigEntries` method of `AppConfigService`:

```typescript
// src/common/config/app-config.service.ts
export class AppConfigService {
  // ...
  get apiKey(): string {
    return this.configService.get<string>('API_KEY')!;
  }

  getConfigEntries(): Record<string, string | number> {
    const entries: {
      key: string;
      value: string | number;
      sensitive?: boolean;
    }[] = [
      // ... existing entries
      { key: 'API_KEY', value: this.apiKey, sensitive: true },
    ];

    return Object.fromEntries(entries.map(({ key, value, sensitive }) => [key, sensitive ? this.obfuscate(String(value)) : value]));
  }
}
```

## Troubleshooting

### Pre-commit / pre-push hooks fail with a wrong Node.js version

Husky's Git hooks run using the **global** `node` binary, not the one activated by `nvm use`. If your global Node.js version doesn't match the project's requirement (v24), the hooks will fail.

**Fix — set nvm's default alias to Node 24:**

```bash
nvm alias default 24
```

After setting the alias, **restart VS Code** (or reload the window) so that the integrated terminal picks up the updated default. The hooks will now use the correct Node.js version.

## License

This project is [MIT](LICENSE) licensed.
