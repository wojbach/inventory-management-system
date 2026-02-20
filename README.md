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

## Prerequisites

- **Node.js** >= 24 LTS Krypton (see `.nvmrc` — run `nvm use` to switch automatically)
- **Yarn** (v1 classic)
- **[nvm](https://github.com/nvm-sh/nvm)** _(optional)_ — recommended for managing Node.js versions

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

This will also automatically set up Git hooks via Husky (see [Git Hooks](#git-hooks) below).

### 2. Run the application

```bash
# Development (watch mode — auto-restarts on file changes)
yarn start:dev

# Production
yarn build
yarn start:prod
```

The application will start on `http://localhost:3000` by default.

### 3. Run tests

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:cov

# E2E tests
yarn test:e2e
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

| Hook           | What runs                                               | Purpose                                            |
| -------------- | ------------------------------------------------------- | -------------------------------------------------- |
| **pre-commit** | `lint-staged` (ESLint + Prettier on staged `.ts` files) | Ensures all committed code is linted and formatted |
| **pre-push**   | `yarn test`                                             | Ensures all tests pass before code is pushed       |

#### How it works

1. **`yarn install`** triggers the `prepare` script, which runs `husky`
2. Husky sets Git's `core.hooksPath` to the `.husky/` directory
3. When you `git commit`, Git executes `.husky/pre-commit` → runs `lint-staged`
   - `lint-staged` runs ESLint and Prettier **only on staged files**, and automatically re-stages any fixes
4. When you `git push`, Git executes `.husky/pre-push` → runs `yarn test`
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
| `yarn test:e2e`    | `jest (e2e config)`          | Run end-to-end tests    |

## Configuration Management

For maintainability and troubleshooting, **no environment variables should be accessed directly via `process.env` or NestJS `ConfigService`** throughout the codebase.

Instead, any configuration variable should be accessed **only** via the `AppConfigService` (`src/core/config/app-config.service.ts`).

### Environment Validation

Every new environment variable must be validated ensuring application safety on startup. We use the `EnvironmentVariables` class (`src/core/config/env.validation.ts`) in conjunction with `class-validator` and `class-transformer` for this purpose.

To add a new variable, define it in the `EnvironmentVariables` class with appropriate validation decorators:

```typescript
// src/core/config/env.validation.ts
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
// src/core/config/app-config.service.ts
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

    return Object.fromEntries(
      entries.map(({ key, value, sensitive }) => [
        key,
        sensitive ? this.obfuscate(String(value)) : value,
      ]),
    );
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
