# CRUSH.md - Virtual Chat Room Development Guide

## Build & Development Commands

- `npm run dev` - Start development server (port 3000) with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:api` - Test API connections: `node test-api.js`
- `npm run test:chat` - Test chat LLM calls: `node test-chat-llm.js`
- `npm run test:user-config` - Test user configuration: `node test-user-config.js`

## Database Commands

- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database

## Code Style Guidelines

### TypeScript & React
- Strict TypeScript with `"noImplicitAny": false`, `"noUnusedVars": "off"`
- Functional components with hooks, interface for types
- Import order: React → third-party → relative imports (use @/ alias)
- ESLint rules: react-hooks/exhaustive-deps off, react/no-unescaped-entities off

### Project Structure
- Components: `src/components/` (UI primitives in subdirectories)
- Utilities: `src/lib/` (services, utilities)
- API routes: `src/app/api/` (Next.js 13+ app router)
- Database: `prisma/schema.prisma`, SQLite storage
- Characters: `characters/` (organized by categories)
- Config: `config/` (API configurations)
- Docs: `docs/` (documentation and guides)
- Scripts: `scripts/` (test and setup scripts)

### Naming & Files
- Components: PascalCase (`CharacterManager`)
- Functions/variables: camelCase (`handleSendMessage`)
- UI components: kebab-case, utilities: camelCase
- Character files: `.txt`, `.json`, `.md` formats supported

### Styling & UI
- Tailwind CSS with custom theme variables
- shadcn/ui component patterns
- CSS variables for theming (tailwind.config.ts)
- Chinese UI with error messages

### Error Handling & APIs
- Try-catch for all API calls with graceful fallbacks
- Primary: Z.ai SDK, fallback: OpenAI API, Ollama (local)
- Config via `config/api-config-user.json`
- Character memories in `storage/memory_banks/` (JSON format)
- Character files organized in `characters/categories/` with subdirectories:
  - `professional/`: AI experts, entrepreneurs, tech experts
  - `entertainment/`: Artists, entertainers
  - `education/`: Philosophers, teachers
  - `custom/`: User-defined characters
  - `themes/`: Dynamic theme-based character directories
- Character templates in `characters/templates/`
- Supported formats: .txt, .json, .md
- Theme-based character loading and management

### Testing
- Manual testing only (no test framework)
- Always test API connectivity before chat features
- Verify database schema changes with Prisma