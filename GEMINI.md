# Chat4 - Virtual Character Chatroom with Local LLM Support

## Project Overview

Chat4 is a modern, open-source AI chat application built with Next.js, TypeScript, and Prisma. It is designed with a privacy-first approach, featuring robust integration with local LLMs via Ollama. The application allows users to create and manage multiple AI characters, each with persistent memory, in themed chatrooms. It also supports commercial AI providers like OpenAI and Anthropic.

The backend is a custom Node.js server that uses Socket.IO for real-time communication, integrated with the Next.js application. The database is managed by Prisma, using SQLite for local development and supporting PostgreSQL for production. The project emphasizes a full testing suite, including unit, integration, and end-to-end tests using Jest and Playwright.

### Key Technologies

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Backend**: Custom Node.js server with `server.ts` as the entry point
-   **Real-time**: Socket.IO
-   **Database**: Prisma ORM (SQLite for dev)
-   **AI Integration**: Ollama, OpenAI, Anthropic
-   **UI**: Tailwind CSS, shadcn/ui
-   **Testing**: Jest (Unit/Integration), Playwright (E2E)

## Building and Running

The project uses `npm` as the package manager and `tsx` for running TypeScript files directly.

### Key Commands

-   **Install Dependencies:**
    ```bash
    npm install
    ```

-   **Run Development Server:**
    *   Starts the custom server with Next.js and Socket.IO.
    ```bash
    npm run dev
    ```

-   **Build for Production:**
    ```bash
    npm run build
    ```

-   **Run Production Server:**
    ```bash
    npm run start
    ```

-   **Database Management (Prisma):**
    *   Apply schema changes (dev):
        ```bash
        npm run db:push
        ```
    *   Run migrations (dev):
        ```bash
        npm run db:migrate
        ```
    *   Generate Prisma Client:
        ```bash
        npm run db:generate
        ```

-   **Testing:**
    *   Run all tests via the custom runner:
        ```bash
        npm run test:all
        ```
    *   Run E2E tests directly with Playwright:
        ```bash
        npm run test:e2e:framework
        ```
    *   Run unit tests with Jest:
        ```bash
        npm run test:unit
        ```

-   **Linting & Code Quality:**
    ```bash
    npm run lint
    npm run type-check
    ```

## Project Structure

-   `server.ts`: The main entry point for the application, which sets up the Next.js app and the Socket.IO server.
-   `src/`: Contains the core application source code, including Next.js pages/routes, UI components, and business logic.
-   `src/lib/socket.ts`: Contains the core implementation for the Socket.IO real-time layer.
-   `prisma/`: Contains the database schema (`schema.prisma`) and migration files.
-   `tests/`: Contains all test files, organized into `unit`, `integration`, and `e2e`.
-   `scripts/`: Contains various helper scripts for testing, deployment, and automation.
-   `public/`: Static assets.
-   `docs/`: Project documentation.

## Development Conventions

-   **Data Modeling:** All data models are defined in `prisma/schema.prisma`. Changes should be made there and applied through Prisma's migration commands.
-   **Real-time Communication:** Server-side socket logic is handled in `src/lib/socket.ts`.
-   **Testing:** The project maintains a comprehensive test suite. New features should be accompanied by relevant tests.
    -   Unit and integration tests are written with Jest.
    -   End-to-end tests are written with Playwright and are located in `tests/e2e`.
-   **Code Style:** The project uses ESLint and Prettier for code consistency. Run `npm run lint` to check for issues.
