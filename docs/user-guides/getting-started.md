# Getting Started with Chat4

Welcome to Chat4! This guide will help you get up and running with the virtual character chatroom application.

## 🎯 What is Chat4?

Chat4 is a sophisticated virtual character chatroom application that supports multiple AI providers, with special emphasis on local LLM integration through Ollama. It allows you to:

- Create and manage virtual characters with different personalities
- Organize characters by conversation themes
- Chat with multiple characters simultaneously
- Use local AI models for private, offline conversations
- Extend functionality through themes and custom configurations

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: Version 2.0 or higher
- **Ollama**: For local LLM support (optional but recommended)

### Checking Prerequisites

```bash
# Check Node.js version
node --version
# Should be 18.0 or higher

# Check npm version
npm --version
# Should be 8.0 or higher

# Check Git version
git --version
# Should be 2.0 or higher

# Check Ollama (optional)
ollama --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/chat4.git
cd chat4
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file
nano .env  # or use your preferred editor
```

Add your configuration:

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=file:./db/custom.db

# AI Provider Configuration
ZAI_API_KEY=your_zai_api_key
OPENAI_API_KEY=your_openai_api_key

# Ollama Configuration (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Security Configuration
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### 5. Start the Application

```bash
# Start the development server
npm run dev
```

### 6. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## 🤖 Setting Up Local AI (Optional)

For the best experience with local AI models, set up Ollama:

### 1. Install Ollama

Follow the instructions at [https://ollama.ai/](https://ollama.ai/) to install Ollama for your operating system.

### 2. Start Ollama Service

```bash
# Start Ollama in the background
ollama serve
```

### 3. Download a Model

```bash
# Download the recommended model
ollama pull llama2

# Or choose from other available models
ollama pull mistral
ollama pull codellama
```

### 4. Verify Ollama Setup

```bash
# Check available models
ollama list

# Test Ollama API
curl http://localhost:11434/api/tags
```

## 🎮 First Steps

### 1. Explore the Interface

When you first open Chat4, you'll see:

- **Sidebar**: Navigation and character management
- **Main Area**: Chat interface
- **Character Panel**: Active characters and their status

### 2. Create Your First Character

1. Click on "Characters" in the sidebar
2. Click "Upload Character Files"
3. Select a character file (.txt, .json, or .md)
4. Wait for the character to be processed and activated

### 3. Start a Conversation

1. Type a message in the chat input
2. Press Enter or click Send
3. Watch as characters respond based on their personalities and interest levels

### 4. Create a Theme

1. Click on "Themes" in the sidebar
2. Click "Create New Theme"
3. Enter a theme name (e.g., "Technology Discussion")
4. Upload characters specifically for this theme

## 🎨 Basic Configuration

### AI Provider Selection

Chat4 supports multiple AI providers:

1. **Local (Ollama)**: Private, offline AI conversations
2. **Z.ai**: Cloud-based AI service
3. **OpenAI**: Popular cloud AI service

The application automatically selects the best available provider.

### Character Settings

Each character has configurable settings:

- **Participation Level**: How actively the character participates (0-1)
- **Interest Threshold**: Minimum interest required to respond (0-1)
- **Category**: Character type (Professional, Entertainment, Education, Custom)

### Theme Management

Themes help organize characters for specific conversation types:

- Create themes for different topics
- Upload specialized characters for each theme
- Switch between themes to focus conversations

## 📱 Mobile Usage

Chat4 is fully responsive and works well on mobile devices:

- **Touch-friendly interface**
- **Responsive design**
- **Mobile-optimized controls**
- **Progressive Web App (PWA) features**

## 🔧 Common Tasks

### Adding Characters

1. Prepare a character file in .txt, .json, or .md format
2. Use the "Upload Character Files" feature
3. Wait for processing and activation

### Managing Characters

- **Activate/Deactivate**: Toggle character participation
- **Edit Settings**: Modify character parameters
- **Delete**: Remove characters from the system

### Creating Themes

1. Go to the Themes section
2. Click "Create New Theme"
3. Name your theme descriptively
4. Upload relevant characters

### Testing AI Integration

1. Go to Settings > API Configuration
2. Test different AI providers
3. Verify local Ollama connection
4. Check response times and quality

## 🚨 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check port availability
netstat -an | grep :3000

# Use a different port
PORT=3001 npm run dev
```

**Database connection issues**
```bash
# Reset database
npm run db:reset

# Regenerate Prisma client
npm run db:generate
```

**Ollama connection issues**
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama service
# (Varies by operating system)
```

**Characters not responding**
1. Check AI provider configuration
2. Verify API keys
3. Test network connectivity
4. Check character interest thresholds

### Getting Help

If you encounter issues:

1. **Check the logs**: Look for error messages in the console
2. **Review settings**: Verify your configuration
3. **Check dependencies**: Ensure all requirements are met
4. **Search issues**: Look for similar problems in GitHub issues
5. **Create an issue**: If you can't find a solution

## 📚 Next Steps

### Explore Features

- **Memory System**: Learn how characters remember conversations
- **Advanced Themes**: Create complex theme structures
- **Custom Models**: Set up specialized AI models
- **API Integration**: Connect external services

### Customize Your Experience

- **Custom Characters**: Create characters for your specific needs
- **Theme Organization**: Structure themes for your use cases
- **AI Configuration**: Optimize AI provider settings
- **Interface Customization**: Modify the appearance and behavior

### Contribute to the Project

- **Report Issues**: Help improve the application
- **Suggest Features**: Request new functionality
- **Submit Pull Requests**: Contribute code improvements
- **Improve Documentation**: Help make the docs better

## 🎉 Congratulations!

You've successfully set up Chat4 and are ready to start exploring virtual character conversations! Here are some suggestions for getting the most out of the application:

### Try These First

1. **Upload a few characters** with different personalities
2. **Create a theme** for a specific topic you're interested in
3. **Start a group chat** with multiple characters
4. **Experiment with different AI providers** to compare responses
5. **Test the memory system** by having multi-conversation sessions

### Join the Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Participate in community discussions
- **Discord**: Join our Discord server for real-time chat
- **Twitter**: Follow us for updates and announcements

---

Happy chatting with your virtual characters! 🎉