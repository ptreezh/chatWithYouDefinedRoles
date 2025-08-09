# Chat4 - Virtual Character Chatroom with Local LLM Support

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-supported-red.svg)](https://ollama.ai/)

A sophisticated virtual character chatroom application that supports multiple AI providers, with special emphasis on local LLM integration through Ollama. Built with Next.js, TypeScript, and modern web technologies.

## 🌟 Features

### 🤖 Multi-AI Provider Support
- **Local LLM**: Full Ollama integration for offline, private AI conversations
- **Cloud Services**: Z.ai and OpenAI as fallback options
- **Smart Fallback**: Automatic switching between providers based on availability

### 🎭 Advanced Character Management
- **Theme-based Organization**: Create conversation themes with dedicated characters
- **Dynamic Character Upload**: Support for .txt, .json, and .md character files
- **Category System**: Pre-defined categories (Professional, Entertainment, Education, Custom)
- **Memory System**: Persistent character memories and conversation history

### 🧪 Comprehensive Testing
- **End-to-End Testing**: Complete conversation flow validation
- **Performance Testing**: Load testing and benchmarking
- **Health Monitoring**: Real-time system health checks
- **Automated Test Suite**: Full test automation with detailed reporting

### 🚀 Modern Architecture
- **Next.js 15**: Latest App Router with server components
- **TypeScript**: Full type safety and better developer experience
- **Prisma**: Modern database toolkit with SQLite support
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Ollama (for local LLM support, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chat4.git
   cd chat4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Quick Setup with Ollama

1. **Install and start Ollama**
   ```bash
   # Follow instructions at https://ollama.ai/
   ollama serve
   ```

2. **Download a model**
   ```bash
   ollama pull llama2
   ```

3. **Run the automated deployment**
   ```bash
   npm run deploy
   ```

## 📖 Documentation

### User Guides
- [Getting Started](docs/user-guides/getting-started.md)
- [Character Management](docs/user-guides/character-management.md)
- [Theme System](docs/user-guides/theme-system.md)
- [API Configuration](docs/user-guides/api-configuration.md)

### Development
- [Development Setup](docs/development/development-setup.md)
- [Architecture Overview](docs/development/architecture.md)
- [Code Style Guidelines](docs/development/code-style.md)
- [Testing Guidelines](docs/development/testing.md)
- [Contributing Guide](CONTRIBUTING.md)

### Deployment
- [Deployment Options](docs/deployment/deployment-options.md)
- [Local Deployment](docs/deployment/local-deployment.md)
- [Production Deployment](docs/deployment/production-deployment.md)
- [Docker Deployment](docs/deployment/docker-deployment.md)

### API Reference
- [REST API](docs/api/rest-api.md)
- [WebSocket API](docs/api/websocket-api.md)
- [Configuration Endpoints](docs/api/configuration.md)
- [Error Handling](docs/api/error-handling.md)

## 🧪 Testing

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

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **React 18** with Hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library

### Backend
- **Next.js API Routes** for serverless functions
- **Prisma ORM** with SQLite database
- **Socket.io** for real-time communication
- **Memory Bank** system for character persistence

### AI Integration
- **Ollama SDK** for local LLM support
- **Z.ai SDK** for cloud AI services
- **OpenAI API** integration
- **Smart provider selection and fallback**

### Data Flow
```
User Input → Interest Evaluation → Character Selection → LLM Processing → Response Generation → Memory Update → Display
```

## 🎯 Use Cases

### 1. **Personal AI Assistant**
- Create specialized AI characters for different tasks
- Maintain conversation history and context
- Use local LLMs for privacy and offline access

### 2. **Educational Platform**
- Create AI tutors for different subjects
- Theme-based character organization
- Interactive learning experiences

### 3. **Customer Support**
- Specialized support characters
- Conversation history for context
- Multi-language support

### 4. **Research Assistant**
- AI research assistants with specialized knowledge
- Academic theme organization
- Citation and reference management

## 🔧 Configuration

### Environment Variables
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

### Character Configuration
Characters can be configured through:
- **File Upload**: .txt, .json, or .md files
- **API Endpoints**: RESTful character management
- **Database**: Direct database operations

## 📊 Performance

### Benchmarks
- **Response Time**: 2-5 seconds (depending on model and hardware)
- **Concurrent Users**: Supports 10-20 concurrent users
- **Memory Usage**: Optimized for production environments
- **Database Performance**: SQLite with proper indexing

### Optimization
- **Response Caching**: Intelligent caching for frequently asked questions
- **Database Optimization**: Proper indexing and query optimization
- **Asset Optimization**: Optimized images and static assets
- **Code Splitting**: Automatic code splitting and lazy loading

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow the established code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Ollama](https://ollama.ai/) for local LLM support
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://prisma.io/) for the modern database toolkit

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-username/chat4/issues)
3. Create a new issue if needed

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/chat4&type=Date)](https://star-history.com/#your-username/chat4&Date)

---

<div align="center">
  <strong>Chat4 - Where Virtual Characters Meet Local AI</strong>
</div>
