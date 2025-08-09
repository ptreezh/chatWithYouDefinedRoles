# Development Setup

This guide will help you set up your development environment for contributing to Chat4.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: Version 2.0 or higher
- **Ollama**: For local LLM testing (optional)

## 🛠️ Installation Steps

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/chat4.git
cd chat4
```

### 2. Configure Upstream

```bash
git remote add upstream https://github.com/original-username/chat4.git
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./db/custom.db

# AI Provider Configuration
ZAI_API_KEY=your_zai_key
OPENAI_API_KEY=your_openai_key

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing Setup

### Running Tests

```bash
# Install test dependencies
npm install

# Run all tests
npm run test:all

# Run specific test types
npm run test:e2e        # End-to-end tests
npm run test:performance # Performance tests
npm run test:basic       # Basic functionality tests
```

### Setting Up Ollama (Optional)

For testing local LLM features:

1. **Install Ollama**
   ```bash
   # Follow instructions at https://ollama.ai/
   ```

2. **Start Ollama Service**
   ```bash
   ollama serve
   ```

3. **Download a Model**
   ```bash
   ollama pull llama2
   ```

4. **Test Ollama Integration**
   ```bash
   npm run test:basic
   ```

## 📁 Project Structure

```
Chat4/
├── docs/                    # Documentation
│   ├── user-guides/         # User documentation
│   ├── development/         # Development docs
│   ├── deployment/          # Deployment guides
│   ├── api/                 # API documentation
│   └── contributing/        # Contributing guide
├── scripts/                 # Build and utility scripts
├── src/                     # Source code
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities and configs
├── prisma/                  # Database schema
├── public/                  # Static assets
├── characters/             # Character files
├── storage/                 # Application storage
└── test-reports/           # Test reports
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the code style guidelines
- Write tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run the test suite
npm run test:all

# Run linting
npm run lint

# Build the application
npm run build
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add your feature name"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Fill in the PR template
- Link to any relevant issues

## 🎨 Code Style Guidelines

### TypeScript

- Use explicit return types
- Use interfaces for object shapes
- Avoid `any` type when possible

```typescript
// Good
interface CharacterConfig {
  name: string;
  systemPrompt: string;
  participationLevel: number;
}

// Bad
function createCharacter(config: any) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow established naming conventions

```typescript
// Good
interface CharacterManagerProps {
  characters: Character[];
  onCharacterSelect: (character: Character) => void;
}

export default function CharacterManager({ 
  characters, 
  onCharacterSelect 
}: CharacterManagerProps) {
  // ...
}
```

### File Organization

- Keep related functionality together
- Use descriptive file names
- Follow the established directory structure

## 🧪 Development Tools

### VS Code Extensions

Recommended extensions for development:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - TypeScript support
- **Prisma** - Database toolkit
- **Tailwind CSS** - CSS framework
- **GitLens** - Git integration

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:reset          # Reset database

# Testing
npm run test:all         # Run all tests
npm run test:e2e          # Run end-to-end tests
npm run test:performance  # Run performance tests

# Linting
npm run lint             # Run ESLint
```

## 🔍 Debugging

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Or use a different port
   PORT=3001 npm run dev
   ```

2. **Database Connection Issues**
   ```bash
   # Reset database
   npm run db:reset
   
   # Regenerate Prisma client
   npm run db:generate
   ```

3. **Ollama Connection Issues**
   ```bash
   # Check Ollama status
   curl http://localhost:11434/api/tags
   
   # Restart Ollama service
   # (Varies by operating system)
   ```

### Debug Tools

- **React Developer Tools** - React component debugging
- **Chrome DevTools** - Browser debugging
- **Prisma Studio** - Database management
- **PM2 Monitor** - Process monitoring

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Ollama Documentation](https://ollama.ai/docs)

## 🤝 Getting Help

If you need help with development:

1. **Check the Documentation** - Start with the [main documentation](../README.md)
2. **Search Existing Issues** - Your question may have been answered before
3. **Join Discussions** - Participate in GitHub Discussions
4. **Create an Issue** - Use the appropriate issue template

---

Happy coding! 🎉