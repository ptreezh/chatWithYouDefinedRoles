# Architecture Overview

This document provides a high-level overview of Chat4's architecture, including key components, data flow, and design decisions.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)      │◄──►│   (API Routes)   │◄──►│   (Ollama/Z.ai)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         │              │   (SQLite)       │              │
         │              └─────────────────┘              │
         │                                               │
         │              ┌─────────────────┐              │
         │              │   Storage       │              │
         │              │   (File System)  │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chat4 Application                             │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks + Zustand
- **Real-time**: Socket.io for live updates

#### 2. Backend (Next.js API Routes)
- **Serverless Functions**: Next.js API Routes
- **Database**: Prisma ORM with SQLite
- **Authentication**: JWT-based sessions
- **File Management**: File system storage
- **Memory System**: Character persistence

#### 3. AI Services
- **Local LLM**: Ollama integration
- **Cloud Services**: Z.ai and OpenAI APIs
- **Smart Fallback**: Automatic provider selection
- **Model Management**: Dynamic model configuration

## 📊 Data Flow

### 1. User Interaction Flow

```
User Input → Interest Evaluation → Character Selection → LLM Processing → Response Generation → Display
```

### 2. Character Management Flow

```
Character Upload → Parsing & Validation → Database Storage → Memory Bank Creation → Activation
```

### 3. Theme Management Flow

```
Theme Creation → Character Categorization → Dynamic Directory Structure → Theme-based Loading
```

### 4. Memory System Flow

```
Conversation → Context Analysis → Memory Extraction → Storage → Retrieval → Context Enhancement
```

## 🗄️ Database Schema

### Core Tables

#### Characters
```sql
CREATE TABLE Character (
  id                STRING   PRIMARY KEY
  name              STRING   NOT NULL
  systemPrompt      STRING   NOT NULL
  avatar            STRING
  modelConfig       STRING
  participationLevel FLOAT    DEFAULT 0.7
  interestThreshold FLOAT    DEFAULT 0.5
  memoryBankPath    STRING
  category          STRING   DEFAULT 'custom'
  theme             STRING
  filePath          STRING
  isActive          BOOLEAN  DEFAULT true
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Messages
```sql
CREATE TABLE Message (
  id                STRING   PRIMARY KEY
  content           STRING   NOT NULL
  senderType        STRING   NOT NULL  -- 'user' | 'character' | 'system'
  senderId          STRING
  chatRoomId        STRING   NOT NULL
  contextSummary    STRING
  interestScore     FLOAT
  participationReason STRING
  memorySnapshot    STRING
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Chat Rooms
```sql
CREATE TABLE ChatRoom (
  id        STRING   PRIMARY KEY
  name      STRING   NOT NULL
  theme     STRING
  isActive  BOOLEAN  DEFAULT true
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🤖 AI Integration

### Provider Architecture

```
AI Request → Provider Selection → API Call → Response Processing → Fallback → Result
```

### 1. Ollama Integration

```typescript
private async callOllama(prompt: string, config: ModelConfig): Promise<string> {
  const baseUrl = config.baseUrl || 'http://localhost:11434'
  const model = config.model || 'llama2'
  
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: config.temperature || 0.7,
        num_predict: config.maxTokens || 1000
      }
    })
  })
  
  const data = await response.json()
  return data.response
}
```

### 2. Provider Selection Logic

```typescript
async function selectProvider(): Promise<AIProvider> {
  // Try Ollama first (local, private)
  if (await isOllamaAvailable()) {
    return { provider: 'ollama', model: 'llama2' }
  }
  
  // Fallback to cloud services
  if (process.env.ZAI_API_KEY) {
    return { provider: 'zai', model: 'default' }
  }
  
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', model: 'gpt-3.5-turbo' }
  }
  
  throw new Error('No AI provider available')
}
```

## 🎭 Character System

### Character Lifecycle

1. **Creation**
   - File upload (.txt, .json, .md)
   - API creation
   - Template-based creation

2. **Storage**
   - Database persistence
   - File system storage
   - Memory bank creation

3. **Activation**
   - Manual activation
   - Theme-based activation
   - Interest-based activation

4. **Interaction**
   - Message evaluation
   - Response generation
   - Memory updates

### Memory System

```typescript
class MemoryBank {
  async createMemoryBank(characterId: string, name: string, systemPrompt: string) {
    const memoryBank = {
      id: generateId(),
      characterId,
      name,
      systemPrompt,
      memories: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await this.storage.save(memoryBank)
    return memoryBank
  }
  
  async addMemory(memoryBankId: string, memory: Memory) {
    const memoryBank = await this.storage.get(memoryBankId)
    memoryBank.memories.push({
      ...memory,
      timestamp: new Date(),
      id: generateId()
    })
    memoryBank.updatedAt = new Date()
    
    await this.storage.save(memoryBank)
  }
  
  async getRelevantMemories(memoryBankId: string, context: string): Promise<Memory[]> {
    const memoryBank = await this.storage.get(memoryBankId)
    
    // Use semantic search to find relevant memories
    return this.semanticSearch(memoryBank.memories, context)
  }
}
```

## 🌐 Theme System

### Theme Structure

```
characters/
├── themes/                    # Dynamic themes
│   ├── AI Technology/         # User-created theme
│   │   ├── ai_expert.txt
│   │   ├── tech_enthusiast.json
│   │   └── ...
│   ├── Mental Health/          # User-created theme
│   │   ├── therapist.md
│   │   ├── counselor.txt
│   │   └── ...
│   └── ...
├── categories/               # Pre-defined categories
│   ├── professional/         # Professional roles
│   ├── entertainment/        # Entertainment roles
│   ├── education/           # Educational roles
│   └── custom/              # Custom roles
├── templates/               # Character templates
└── examples/               # Example characters
```

### Theme Management

```typescript
class ThemeManager {
  async createTheme(name: string): Promise<Theme> {
    const themePath = path.join(charactersDir, 'themes', name)
    await fs.mkdir(themePath, { recursive: true })
    
    return {
      id: generateId(),
      name,
      path: themePath,
      characterCount: 0,
      createdAt: new Date()
    }
  }
  
  async addCharacterToTheme(themeId: string, character: Character): Promise<void> {
    const theme = await this.getTheme(themeId)
    const characterPath = path.join(theme.path, `${character.name}.txt`)
    
    await fs.writeFile(characterPath, character.systemPrompt)
    theme.characterCount++
    theme.updatedAt = new Date()
    
    await this.saveTheme(theme)
  }
  
  async getCharactersByTheme(themeId: string): Promise<Character[]> {
    const theme = await this.getTheme(themeId)
    const characters = []
    
    const files = await fs.readdir(theme.path)
    for (const file of files) {
      if (file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.md')) {
        const content = await fs.readFile(path.join(theme.path, file), 'utf-8')
        characters.push({
          id: generateId(),
          name: path.basename(file, path.extname(file)),
          systemPrompt: content,
          theme: theme.name
        })
      }
    }
    
    return characters
  }
}
```

## 🔄 Real-time Features

### WebSocket Integration

```typescript
class ChatSocket {
  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : true,
        methods: ['GET', 'POST']
      }
    })
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join-room', (roomId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-joined', { userId: socket.id })
      })
      
      socket.on('send-message', async (data) => {
        const { roomId, message, characterId } = data
        
        // Process message through AI system
        const response = await this.processMessage(message, characterId)
        
        // Broadcast to all users in room
        this.io.to(roomId).emit('message-received', {
          id: generateId(),
          message,
          response,
          characterId,
          timestamp: new Date()
        })
      })
      
      socket.on('disconnect', () => {
        // Handle disconnection
      })
    })
  }
}
```

## 📊 Performance Considerations

### 1. Database Optimization

- **Indexing**: Proper indexes on frequently queried fields
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Efficient query design

### 2. Caching Strategy

- **Response Caching**: Cache AI responses for common questions
- **Character Caching**: Cache character data in memory
- **Theme Caching**: Cache theme structures

### 3. File System Optimization

- **Character Storage**: Organized file structure for efficient access
- **Memory Storage**: Efficient memory bank storage and retrieval
- **Log Management**: Structured logging with rotation

### 4. AI Provider Optimization

- **Connection Pooling**: Reuse AI service connections
- **Request Batching**: Batch multiple AI requests when possible
- **Fallback Strategy**: Graceful fallback between providers

## 🔒 Security Considerations

### 1. Authentication

- **JWT Tokens**: Stateless authentication
- **Session Management**: Secure session handling
- **Rate Limiting**: Prevent abuse

### 2. Data Protection

- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user-generated content

### 3. File Security

- **File Type Validation**: Only allow safe file types
- **File Size Limits**: Prevent large file uploads
- **Path Traversal Prevention**: Secure file paths

## 📈 Scalability

### 1. Horizontal Scaling

- **Load Balancing**: Distribute load across multiple instances
- **Database Sharding**: Split database across multiple servers
- **CDN Integration**: Use CDN for static assets

### 2. Vertical Scaling

- **Resource Optimization**: Efficient resource usage
- **Performance Monitoring**: Monitor and optimize performance
- **Autoscaling**: Automatically scale based on demand

### 3. Caching Layers

- **Application Cache**: In-memory caching
- **Database Cache**: Query result caching
- **CDN Cache**: Content delivery network caching

---

This architecture provides a solid foundation for the Chat4 application, with clear separation of concerns, efficient data flow, and room for growth and optimization.