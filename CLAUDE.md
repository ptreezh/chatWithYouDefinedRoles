# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat4 is a sophisticated virtual character chatroom application built with Next.js 15, TypeScript, and modern web technologies. It supports multiple AI providers with special emphasis on local LLM integration through Ollama, along with cloud services like Z.ai and OpenAI.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

### Testing Suite
```bash
npm run test:api         # API functionality tests
npm run test:chat        # Chat LLM integration tests
npm run test:user-config # User configuration tests
npm run test:e2e         # End-to-end tests
npm run test:performance # Performance and load tests
npm run test:health      # Health check endpoint
npm run test:all         # Run complete test suite
npm run test:quick       # Quick API and health tests
npm run test:full        # Comprehensive testing
npm run test:basic       # Basic functionality tests
```

### Deployment
```bash
npm run deploy           # Automated deployment
npm run deploy:local     # Local deployment
npm run deploy:pm2       # PM2 process manager deployment
npm run deploy:docker    # Docker container deployment
npm run deploy:vercel    # Vercel platform deployment
npm run deploy:quick     # Quick deployment script
```

### Quick Start Scripts
```bash
npm run quickstart       # Quick setup and start
npm run go               # Alternative start command
npm run smart-start      # Intelligent startup with diagnostics
```

## Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router and Server Components
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks with Zustand for complex state
- **Real-time**: Socket.io for live chat updates
- **UI Components**: Modular component system in `src/components/ui/`

### Backend Architecture
- **Server**: Custom Next.js server with Socket.IO integration (`server.ts`)
- **API Routes**: RESTful endpoints in `src/app/api/`
- **Database**: Prisma ORM with SQLite database
- **Authentication**: JWT-based session management
- **File Storage**: File system based character storage
- **Memory System**: Persistent character memory banks

### Key Components

#### Chat System (`src/app/page.tsx`)
- Main chat interface with real-time messaging
- Character management and activation
- Interest evaluation and response generation
- Theme-based character organization

#### API Routes (`src/app/api/`)
- `/api/chat/*` - Chat processing and response generation
- `/api/characters/*` - Character CRUD operations
- `/api/config` - API configuration management
- `/api/health` - System health monitoring
- `/api/models` - AI model management
- `/api/ollama` - Ollama integration
- `/api/memory` - Memory bank operations

#### Character System
- **Storage**: Characters stored in database and file system
- **Formats**: Support for .txt, .json, and .md character files
- **Categories**: Pre-defined categories (Professional, Entertainment, Education, Custom)
- **Themes**: Dynamic theme-based character organization
- **Memory**: Persistent conversation history and context

#### AI Integration
- **Multi-provider**: Ollama (local), Z.ai (cloud), OpenAI (cloud)
- **Smart Fallback**: Automatic provider selection based on availability
- **Model Configuration**: Dynamic model settings per character
- **Interest Evaluation**: AI-powered topic relevance assessment

## Database Schema

### Core Models
- **Character**: Virtual AI characters with prompts and configurations
- **ChatRoom**: Conversation rooms with themes
- **Message**: Chat messages with context and metadata
- **User**: User accounts and authentication
- **Post**: Content management (unused in current implementation)

### Key Relationships
- Characters → Messages (one-to-many)
- ChatRooms → Messages (one-to-many)
- Users → Posts (one-to-many)

## File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat interface
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── api-config.tsx    # API configuration
│   ├── character-manager.tsx  # Character management
│   └── theme-manager.tsx     # Theme management
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── chat-service.ts   # Chat processing logic
│   ├── db.ts            # Database connection
│   ├── memory-bank.ts   # Memory management
│   ├── socket.ts        # Socket.IO setup
│   └── utils.ts         # General utilities
└── ...
```

## Development Guidelines

### Code Style
- Use TypeScript exclusively with strict type checking
- Follow existing component patterns and naming conventions
- Utilize shadcn/ui components for consistent UI
- Implement proper error handling and loading states

### Testing Approach
- Write comprehensive tests for all new features
- Use the existing test suite structure in `scripts/`
- Test both API endpoints and UI interactions
- Include performance testing for AI integrations

### Database Changes
- Always update Prisma schema first
- Run migrations using provided npm scripts
- Test database changes with both development and production data

### AI Integration
- Test with multiple AI providers when possible
- Implement proper fallback mechanisms
- Handle API rate limits and errors gracefully
- Cache responses where appropriate

## Environment Configuration

### Required Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./db/custom.db

# AI Provider Configuration
ZAI_API_KEY=your_zai_key
OPENAI_API_KEY=your_openai_key

# Ollama Configuration (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Development Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Initialize database: `npm run db:push`
4. Start development server: `npm run dev`

## Key Features

### Character Management
- Upload characters via .txt, .json, or .md files
- Organize characters by themes and categories
- Configure participation levels and interest thresholds
- Persistent memory banks for conversation history

### Multi-AI Support
- Local LLM support via Ollama
- Cloud AI services (Z.ai, OpenAI)
- Smart provider selection and fallback
- Character-specific model configuration

### Real-time Features
- WebSocket-based real-time chat
- Live character responses
- Dynamic theme switching
- Interest-based character participation

### Testing & Monitoring
- Comprehensive automated testing suite
- Performance monitoring and optimization
- Health check endpoints
- Deployment automation

## Common Issues

### Database Connection
- Ensure SQLite database file exists
- Check DATABASE_URL environment variable
- Run `npm run db:push` to initialize schema

### AI Provider Issues
- Verify API keys are correctly set
- Check Ollama service is running for local LLM
- Test provider connectivity with health checks

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript types: `npm run build`

## Performance Considerations

- Implement response caching for AI interactions
- Use database indexing for frequent queries
- Optimize character loading and memory management
- Monitor API rate limits and implement backoff strategies