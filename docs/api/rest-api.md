# API Reference

This section provides detailed documentation for Chat4's API endpoints, WebSocket interface, and integration options.

## 🌐 REST API

### Authentication

Most API endpoints require authentication. Include your JWT token in the Authorization header:

```bash
Authorization: Bearer your_jwt_token
```

### Endpoints

#### Health Check
```http
GET /api/health
```

Check the health status of the application.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "database": "connected",
  "ollama": {
    "status": "connected",
    "models": ["llama2", "mistral", "codellama"]
  }
}
```

#### Configuration
```http
GET /api/config
```

Get the current application configuration.

**Response:**
```json
{
  "zaiConfigured": true,
  "openaiConfigured": true,
  "ollamaConfigured": true,
  "defaultProvider": "ollama"
}
```

### Characters API

#### List Characters
```http
GET /api/characters
```

Retrieve all characters, optionally filtered by theme.

**Parameters:**
- `theme` (optional): Filter characters by theme

**Response:**
```json
{
  "characters": [
    {
      "id": "cmdoq92fq0000xjyio8swblfv",
      "name": "AI Expert",
      "systemPrompt": "You are an AI expert...",
      "participationLevel": 0.8,
      "interestThreshold": 0.4,
      "isActive": true,
      "category": "professional",
      "theme": "technology"
    }
  ]
}
```

#### Create Character
```http
POST /api/characters
Content-Type: multipart/form-data
```

Create a new character by uploading a file or providing configuration.

**Form Data:**
- `file`: Character file (.txt, .json, .md)
- `theme` (optional): Theme name for categorization

**Response:**
```json
{
  "success": true,
  "character": {
    "id": "cmdoq92fq0000xjyio8swblfv",
    "name": "AI Expert",
    "systemPrompt": "You are an AI expert...",
    "participationLevel": 0.8,
    "interestThreshold": 0.4,
    "isActive": true,
    "category": "custom",
    "theme": "technology"
  }
}
```

#### Update Character
```http
PUT /api/characters/{id}
Content-Type: application/json
```

Update an existing character's configuration.

**Request Body:**
```json
{
  "name": "Updated AI Expert",
  "participationLevel": 0.9,
  "interestThreshold": 0.3,
  "isActive": true
}
```

**Response:**
```json
{
  "id": "cmdoq92fq0000xjyio8swblfv",
  "name": "Updated AI Expert",
  "systemPrompt": "You are an AI expert...",
  "participationLevel": 0.9,
  "interestThreshold": 0.3,
  "isActive": true,
  "category": "professional",
  "theme": "technology"
}
```

#### Delete Character
```http
DELETE /api/characters/{id}
```

Delete a character from the system.

**Response:**
```json
{
  "success": true,
  "message": "Character deleted successfully"
}
```

#### Create Character from Template
```http
POST /api/characters/from-template
Content-Type: application/json
```

Create a character from a predefined template.

**Request Body:**
```json
{
  "category": "professional",
  "fileName": "ai_expert.txt"
}
```

**Response:**
```json
{
  "id": "cmdoq92fq0000xjyio8swblfv",
  "name": "AI Expert",
  "systemPrompt": "You are an AI expert...",
  "participationLevel": 0.7,
  "interestThreshold": 0.4,
  "isActive": true,
  "category": "professional",
  "theme": null
}
```

### Themes API

#### List Themes
```http
GET /api/themes
```

Get all available themes.

**Response:**
```json
{
  "themes": [
    {
      "name": "Technology",
      "characterCount": 3,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "lastModified": "2024-01-20T10:30:00.000Z"
    },
    {
      "name": "Mental Health",
      "characterCount": 2,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "lastModified": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

#### Create Theme
```http
POST /api/themes
Content-Type: application/json
```

Create a new theme.

**Request Body:**
```json
{
  "themeName": "New Theme"
}
```

**Response:**
```json
{
  "success": true,
  "theme": {
    "name": "New Theme",
    "characterCount": 0,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "lastModified": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Delete Theme
```http
DELETE /api/themes?theme=ThemeName
```

Delete a theme and all associated characters.

**Response:**
```json
{
  "success": true,
  "message": "Theme 'ThemeName' deleted successfully"
}
```

#### Get Theme Characters
```http
POST /api/themes
Content-Type: application/json
```

Get characters in a specific theme.

**Request Body:**
```json
{
  "category": "professional"
}
```

**Response:**
```json
{
  "category": "professional",
  "characters": [
    {
      "name": "AI Expert",
      "fileName": "ai_expert.txt",
      "extension": ".txt",
      "size": 1024,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "category": "professional"
    }
  ]
}
```

### Chat API

#### Evaluate Interest
```http
POST /api/chat/evaluate
Content-Type: application/json
```

Evaluate character interest in a message.

**Request Body:**
```json
{
  "topic": "What is artificial intelligence?",
  "chatRoomId": "cmdoq92fq0000xjyio8swblfv",
  "characterId": "cmdoq92fq0000xjyio8swblfv"
}
```

**Response:**
```json
{
  "evaluation": {
    "score": 0.8,
    "shouldParticipate": true,
    "reason": "Topic matches character's expertise in AI"
  }
}
```

#### Generate Response
```http
POST /api/chat/respond
Content-Type: application/json
```

Generate a character response to a message.

**Request Body:**
```json
{
  "message": "What is artificial intelligence?",
  "chatRoomId": "cmdoq92fq0000xjyio8swblfv",
  "characterId": "cmdoq92fq0000xjyio8swblfv"
}
```

**Response:**
```json
{
  "response": "Artificial intelligence (AI) is a branch of computer science...",
  "characterId": "cmdoq92fq0000xjyio8swblfv",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "processingTime": 2500
}
```

#### Clear Chat
```http
POST /api/chat/clear
Content-Type: application/json
```

Clear chat history for a room.

**Request Body:**
```json
{
  "chatRoomId": "cmdoq92fq0000xjyio8swblfv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat history cleared successfully"
}
```

### Memory API

#### Get Memory
```http
GET /api/memory?characterId={id}
```

Retrieve a character's memory bank.

**Response:**
```json
{
  "memoryBank": {
    "id": "cmdoq92fq0000xjyio8swblfv",
    "characterId": "cmdoq92fq0000xjyio8swblfv",
    "name": "AI Expert",
    "memories": [
      {
        "id": "cmdoq92fq0000xjyio8swblfv",
        "content": "User asked about AI definitions",
        "timestamp": "2024-01-20T10:30:00.000Z",
        "context": "AI definition discussion"
      }
    ],
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Update Memory
```http
POST /api/memory
Content-Type: application/json
```

Update a character's memory bank.

**Request Body:**
```json
{
  "characterId": "cmdoq92fq0000xjyio8swblfv",
  "content": "User is interested in machine learning",
  "context": "ML discussion",
  "type": "fact"
}
```

**Response:**
```json
{
  "success": true,
  "memory": {
    "id": "cmdoq92fq0000xjyio8swblfv",
    "characterId": "cmdoq92fq0000xjyio8swblfv",
    "content": "User is interested in machine learning",
    "timestamp": "2024-01-20T10:30:00.000Z",
    "context": "ML discussion",
    "type": "fact"
  }
}
```

### Test API

#### Test API Connection
```http
POST /api/test-api
Content-Type: application/json
```

Test connection to an AI provider.

**Request Body:**
```json
{
  "provider": "ollama",
  "apiKey": "your_api_key",
  "model": "llama2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "responseTime": 1200,
  "provider": "ollama"
}
```

## 🔄 WebSocket API

### Connection

Connect to the WebSocket endpoint:

```javascript
const socket = io('http://localhost:3000');
```

### Events

#### Join Room
```javascript
socket.emit('join-room', roomId);
```

#### Send Message
```javascript
socket.emit('send-message', {
  roomId: 'room-id',
  message: 'Hello world',
  characterId: 'character-id'
});
```

#### Receive Message
```javascript
socket.on('message-received', (data) => {
  console.log('New message:', data);
});
```

#### User Joined
```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
});
```

#### User Left
```javascript
socket.on('user-left', (data) => {
  console.log('User left:', data);
});
```

### Error Handling

#### Connection Error
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

#### General Error
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 🤖 AI Provider Integration

### Ollama (Local)

#### Configuration
```json
{
  "provider": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "llama2",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

#### API Call
```javascript
const response = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: temperature,
      num_predict: maxTokens
    }
  })
});
```

### Z.ai (Cloud)

#### Configuration
```json
{
  "provider": "zai",
  "apiKey": "your_zai_key",
  "model": "default",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

#### API Call
```javascript
const ZAI = require('z-ai-web-dev-sdk').default;
const zai = await ZAI.create();

const completion = await zai.chat.completions.create({
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  temperature: temperature,
  max_tokens: maxTokens
});
```

### OpenAI (Cloud)

#### Configuration
```json
{
  "provider": "openai",
  "apiKey": "your_openai_key",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

#### API Call
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: temperature,
    max_tokens: maxTokens
  })
});
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input data",
    "details": "Field 'name' is required"
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "participationLevel",
        "message": "Participation level must be between 0 and 1"
      }
    ]
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 🔧 Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `INVALID_INPUT` | Invalid request data |
| `VALIDATION_ERROR` | Data validation failed |
| `AI_PROVIDER_ERROR` | AI provider error |
| `DATABASE_ERROR` | Database operation failed |
| `FILE_ERROR` | File operation failed |
| `THEME_ERROR` | Theme operation failed |
| `CHARACTER_ERROR` | Character operation failed |

## 📚 Client Libraries

### JavaScript/TypeScript

```typescript
// Installation
npm install chat4-client

// Usage
import { Chat4Client } from 'chat4-client';

const client = new Chat4Client({
  baseUrl: 'http://localhost:3000',
  token: 'your_jwt_token'
});

// List characters
const characters = await client.characters.list();

// Create character
const character = await client.characters.create({
  name: 'AI Expert',
  systemPrompt: 'You are an AI expert...',
  participationLevel: 0.8,
  interestThreshold: 0.4
});

// Send message
const response = await client.chat.sendMessage({
  message: 'Hello!',
  characterId: character.id
});
```

### Python

```python
# Installation
pip install chat4-client

# Usage
from chat4 import Chat4Client

client = Chat4Client(
    base_url='http://localhost:3000',
    token='your_jwt_token'
)

# List characters
characters = client.characters.list()

# Create character
character = client.characters.create(
    name='AI Expert',
    system_prompt='You are an AI expert...',
    participation_level=0.8,
    interest_threshold=0.4
)

# Send message
response = client.chat.send_message(
    message='Hello!',
    character_id=character.id
)
```

## 🔄 Webhooks

### Configure Webhooks

Webhooks allow you to receive real-time notifications about events in your Chat4 application.

#### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "url": "https://your-webhook-url.com/webhook",
  "events": ["message.created", "character.created", "theme.created"]
}
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "id": "webhook_id",
    "url": "https://your-webhook-url.com/webhook",
    "events": ["message.created", "character.created", "theme.created"],
    "secret": "webhook_secret"
  }
}
```

### Webhook Events

#### Message Created
```json
{
  "event": "message.created",
  "data": {
    "id": "message_id",
    "content": "Hello world!",
    "characterId": "character_id",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Character Created
```json
{
  "event": "character.created",
  "data": {
    "id": "character_id",
    "name": "AI Expert",
    "systemPrompt": "You are an AI expert...",
    "category": "professional",
    "theme": "technology",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Theme Created
```json
{
  "event": "theme.created",
  "data": {
    "name": "Technology",
    "characterCount": 0,
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

## 🚀 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Default Limit**: 100 requests per minute
- **Burst Limit**: 200 requests per minute
- **WebSocket**: 50 messages per minute per connection

### Rate Limit Headers

Response headers include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1642694400
```

### Handling Rate Limits

```javascript
try {
  const response = await fetch('/api/characters');
  const data = await response.json();
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    const resetTime = error.response.headers.get('X-RateLimit-Reset');
    console.log('Rate limit exceeded. Reset at:', new Date(resetTime * 1000));
  }
}
```

---

This API reference provides comprehensive documentation for integrating with Chat4. For additional support, please refer to our [GitHub Issues](https://github.com/your-username/chat4/issues) or [Discord community](https://discord.gg/chat4).