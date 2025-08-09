# Chat4 - Virtual Character Chatroom with Local LLM Support

## Project Overview

Chat4 is a sophisticated virtual character chatroom application that supports multiple AI providers, with special emphasis on local LLM integration through Ollama. It allows users to create and interact with AI characters in themed chatrooms, with persistent memory and conversation history.

### Key Technologies

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, SQLite database, Socket.IO for real-time communication
- **AI Integration**: Ollama (local LLM), Z.ai SDK, OpenAI API, Anthropic API, Custom API support
- **Other**: Memory Bank system for character persistence, Docker support

## Project Structure

- `src/`: Main source code
  - `app/`: Next.js App Router pages and API routes
  - `components/`: React UI components
  - `lib/`: Core application logic (database, AI service, memory bank, socket)
  - `types/`: TypeScript type definitions
- `storage/`: Persistent storage for character memory banks
- `db/`: SQLite database files
- `public/`: Static assets
- `scripts/`: Utility scripts for testing, deployment, etc.
- `docs/`: Project documentation

## Building and Running

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Ollama (for local LLM support, optional)

### Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up database**
   ```bash
   # Initialize the database schema
   npm run db:push
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run start
   ```

### Quick Setup with Ollama

1. **Install and start Ollama**
   ```bash
   # Follow instructions at https://ollama.ai/
   ollama serve
   ```

2. **Download a model**
   ```bash
   ollama pull llama3
   ```

3. **Run the automated deployment**
   ```bash
   npm run deploy
   ```

## Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:e2e        # End-to-end tests
npm run test:performance # Performance tests
npm run test:basic       # Basic functionality tests

# Health check
npm run test:health
```

### Test Coverage

- ✅ Unit Tests
- ✅ Integration Tests
- ✅ End-to-End Tests
- ✅ Performance Tests
- ✅ Health Monitoring

## Key Features

### Multi-AI Provider Support

- **Local LLM**: Full Ollama integration for offline, private AI conversations
- **Cloud Services**: Z.ai and OpenAI as fallback options
- **Smart Fallback**: Automatic switching between providers based on availability

### Advanced Character Management

- **Theme-based Organization**: Create conversation themes with dedicated characters
- **Dynamic Character Upload**: Support for .txt, .json, and .md character files
- **Category System**: Pre-defined categories (Professional, Entertainment, Education, Custom)
- **Memory System**: Persistent character memories and conversation history

### Real-time Communication

- **Socket.IO Integration**: Real-time messaging between users and AI characters
- **Chat Rooms**: Themed chatrooms for organized conversations

## Development Conventions

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (implied by project structure)

### Architecture

- **Frontend**: Next.js App Router with server components
- **Backend**: Next.js API Routes for serverless functions
- **Database**: Prisma ORM with SQLite
- **AI Service**: Modular design supporting multiple providers
- **Memory Management**: Custom Memory Bank system for character persistence

### API Design

- RESTful API endpoints under `/api/`
- JSON request/response format
- Proper error handling and status codes

## Configuration

### Environment Variables

See `.env.example` for a complete list of configuration options.

### Character Configuration

Characters can be configured through:
- File upload (.txt, .json, .md)
- API endpoints
- Direct database operations

## Deployment Options

- **Local Deployment**: Run directly on a local machine
- **Docker Deployment**: Containerized deployment with Docker
- **PM2 Deployment**: Process management with PM2
- **Vercel Deployment**: Cloud deployment with Vercel

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request