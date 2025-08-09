# Code Style Guidelines

This document outlines the coding standards and style guidelines for the Chat4 project. Following these guidelines ensures consistency, readability, and maintainability of the codebase.

## 📋 Table of Contents

- [TypeScript Guidelines](#typescript-guidelines)
- [React Guidelines](#react-guidelines)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Commenting Standards](#commenting-standards)
- [Error Handling](#error-handling)
- [Testing Guidelines](#testing-guidelines)
- [Performance Guidelines](#performance-guidelines)

## TypeScript Guidelines

### General Principles

- **Use TypeScript for all new code**: All new files should be written in TypeScript
- **Enable strict mode**: Always use strict TypeScript settings
- **Avoid `any` type**: Use specific types whenever possible
- **Use interfaces for object shapes**: Define clear interfaces for data structures

### Type Definitions

#### Interfaces vs Types

```typescript
// ✅ Use interfaces for object shapes
interface CharacterConfig {
  name: string;
  systemPrompt: string;
  participationLevel: number;
  interestThreshold: number;
}

// ✅ Use types for unions, primitives, or complex types
type CharacterStatus = 'active' | 'inactive' | 'pending';
type CharacterId = string;
```

#### Function Signatures

```typescript
// ✅ Use explicit return types
function createCharacter(config: CharacterConfig): Promise<Character> {
  // Implementation
}

// ✅ Use generic types when appropriate
function getData<T>(url: string): Promise<T> {
  // Implementation
}
```

#### Type Assertions

```typescript
// ✅ Use as syntax for type assertions
const character = characterData as Character;

// ❌ Avoid angle bracket syntax in most cases
const character = <Character>characterData;
```

### Utility Types

```typescript
// ✅ Use utility types when appropriate
type PartialCharacter = Partial<Character>;
type CharacterUpdate = Omit<Character, 'id' | 'createdAt'>;
```

## React Guidelines

### Component Structure

```typescript
// ✅ Functional components with hooks
interface CharacterCardProps {
  character: Character;
  onSelect?: (character: Character) => void;
  className?: string;
}

export default function CharacterCard({ 
  character, 
  onSelect, 
  className = '' 
}: CharacterCardProps) {
  const [isSelected, setIsSelected] = useState(false);
  
  const handleSelect = useCallback(() => {
    setIsSelected(true);
    onSelect?.(character);
  }, [character, onSelect]);
  
  return (
    <div className={`character-card ${className} ${isSelected ? 'selected' : ''}`}>
      {/* Component content */}
    </div>
  );
}
```

### Hooks Usage

```typescript
// ✅ Use hooks at the top level
function CharacterList({ characters }: CharacterListProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const handleCharacterSelect = useCallback((character: Character) => {
    setSelectedCharacter(character);
  }, []);
  
  // ✅ Custom hooks
  const { data, loading, error } = useCharacterData(selectedCharacter?.id);
  
  // ✅ Effect hooks with dependencies
  useEffect(() => {
    if (characters.length > 0) {
      setSelectedCharacter(characters[0]);
    }
  }, [characters]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {characters.map(character => (
        <CharacterCard
          key={character.id}
          character={character}
          onSelect={handleCharacterSelect}
        />
      ))}
    </div>
  );
}
```

### Event Handlers

```typescript
// ✅ Use useCallback for event handlers
const handleSendMessage = useCallback(async (message: string) => {
  try {
    const response = await chatService.sendMessage(message);
    setMessages(prev => [...prev, response]);
  } catch (error) {
    setError(error);
  }
}, [chatService]);
```

### Conditional Rendering

```typescript
// ✅ Use ternary operators for simple conditions
{isLoading ? <LoadingSpinner /> : <Content />}

// ✅ Use && operator for simple existence checks
{error && <ErrorMessage error={error} />}

// ✅ Use early returns for complex conditions
function CharacterCard({ character }: CharacterCardProps) {
  if (!character) return null;
  
  return (
    <div>
      {/* Card content */}
    </div>
  );
}
```

## File Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui components
│   ├── character/         # Character-related components
│   ├── chat/              # Chat-related components
│   └── layout/            # Layout components
├── hooks/                  # Custom hooks
├── lib/                    # Utilities and configurations
└── types/                  # Type definitions
```

### File Naming

```typescript
// ✅ Use PascalCase for React components
CharacterCard.tsx
CharacterList.tsx
ChatInterface.tsx

// ✅ Use camelCase for utilities and hooks
useCharacterData.ts
useThemeManager.ts
formatMessage.ts

// ✅ Use kebab-case for UI component files
character-card.tsx
chat-interface.tsx

// ✅ Use descriptive names for files
character-service.ts
theme-manager.ts
memory-bank.ts
```

### Export Patterns

```typescript
// ✅ Default export for main component
export default function CharacterCard() { /* ... */ }

// ✅ Named exports for utilities
export const useCharacterData = () => { /* ... */ };
export const formatMessage = () => { /* ... */ };

// ✅ Multiple exports when needed
export { CharacterCard, CharacterList };
export type { Character, CharacterConfig };
```

## Naming Conventions

### Variables and Constants

```typescript
// ✅ Use camelCase for variables
const characterName = 'AI Assistant';
const isActive = true;
const maxParticipants = 10;

// ✅ Use UPPER_SNAKE_CASE for constants
const MAX_PARTICIPANTS = 10;
const API_BASE_URL = 'https://api.example.com';

// ✅ Use descriptive names
const characterList = characters.filter(c => c.isActive);
const hasActiveCharacters = characters.some(c => c.isActive);
```

### Functions and Methods

```typescript
// ✅ Use camelCase for functions
function createCharacter(config: CharacterConfig): Promise<Character> {
  // Implementation
}

// ✅ Use descriptive verb-noun naming
function sendMessage(message: string): Promise<void> {
  // Implementation
}

// ✅ Use boolean prefixes for boolean functions
function isActive(character: Character): boolean {
  return character.isActive;
}

function hasCharacters(): boolean {
  return characters.length > 0;
}
```

### Interfaces and Types

```typescript
// ✅ Use PascalCase for interfaces and types
interface CharacterConfig {
  name: string;
  systemPrompt: string;
  participationLevel: number;
}

type CharacterStatus = 'active' | 'inactive' | 'pending';

// ✅ Use descriptive names
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
```

### Components

```typescript
// ✅ Use PascalCase for component names
function CharacterCard() { /* ... */ }

// ✅ Use descriptive prop names
interface CharacterCardProps {
  character: Character;
  onSelect?: (character: Character) => void;
  className?: string;
}
```

## Commenting Standards

### JSDoc Comments

```typescript
/**
 * Creates a new character with the given configuration.
 * 
 * @param config - The character configuration
 * @returns Promise that resolves to the created character
 * @throws Error if character creation fails
 */
export async function createCharacter(config: CharacterConfig): Promise<Character> {
  // Implementation
}
```

### Interface Documentation

```typescript
/**
 * Configuration for creating a character
 * 
 * @interface CharacterConfig
 */
interface CharacterConfig {
  /** The name of the character */
  name: string;
  
  /** The system prompt that defines the character's behavior */
  systemPrompt: string;
  
  /** The level of participation in conversations (0-1) */
  participationLevel: number;
  
  /** The threshold for showing interest in topics (0-1) */
  interestThreshold: number;
}
```

### Inline Comments

```typescript
// Use comments to explain complex logic
function calculateInterestScore(message: string, character: Character): number {
  // Extract keywords from message
  const keywords = extractKeywords(message);
  
  // Calculate relevance based on character's expertise
  const relevance = calculateRelevance(keywords, character.expertise);
  
  // Apply interest threshold
  return Math.max(0, relevance - character.interestThreshold);
}

// Use TODO comments for future improvements
// TODO: Implement caching for character data
// FIXME: Handle edge case when character is null
```

## Error Handling

### Try-Catch Blocks

```typescript
// ✅ Use try-catch for async operations
async function sendMessage(message: string): Promise<Message> {
  try {
    const response = await chatService.sendMessage(message);
    return response;
  } catch (error) {
    // Log error for debugging
    console.error('Failed to send message:', error);
    
    // Re-throw with context
    throw new Error(`Failed to send message: ${error.message}`);
  }
}
```

### Error Types

```typescript
// ✅ Define specific error types
class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// Use specific errors
function validateCharacter(config: CharacterConfig): void {
  if (!config.name?.trim()) {
    throw new ChatError('Character name is required', 'INVALID_NAME', 400);
  }
  
  if (!config.systemPrompt?.trim()) {
    throw new ChatError('System prompt is required', 'INVALID_PROMPT', 400);
  }
}
```

### Error Boundaries

```typescript
// ✅ Use error boundaries for React components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Guidelines

### Test File Organization

```
tests/
├── __mocks__/           # Mock files
├── utils/              # Test utilities
├── components/         # Component tests
├── hooks/              # Hook tests
├── services/           # Service tests
├── integration/        # Integration tests
└── e2e/               # End-to-end tests
```

### Test Naming

```typescript
// ✅ Use descriptive test names
describe('CharacterService', () => {
  describe('createCharacter', () => {
    it('should create a new character with valid config', async () => {
      // Test implementation
    });
    
    it('should throw error for invalid character name', async () => {
      // Test implementation
    });
  });
});
```

### Test Structure

```typescript
// ✅ Use AAA pattern (Arrange, Act, Assert)
describe('CharacterManager', () => {
  it('should add character to theme', async () => {
    // Arrange
    const themeManager = new ThemeManager();
    const character = createTestCharacter();
    
    // Act
    await themeManager.addCharacterToTheme('test-theme', character);
    
    // Assert
    const themeCharacters = await themeManager.getCharactersByTheme('test-theme');
    expect(themeCharacters).toContainEqual(character);
  });
});
```

## Performance Guidelines

### React Performance

```typescript
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* Complex rendering */}</div>;
});

// ✅ Use useMemo for expensive calculations
function CharacterList({ characters }: CharacterListProps) {
  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => a.name.localeCompare(b.name));
  }, [characters]);
  
  return (
    <div>
      {sortedCharacters.map(character => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}

// ✅ Use useCallback for event handlers
function ChatInterface() {
  const handleSendMessage = useCallback(async (message: string) => {
    await sendMessage(message);
  }, [sendMessage]);
  
  return (
    <div>
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
```

### Database Performance

```typescript
// ✅ Use efficient queries
async function getActiveCharacters(): Promise<Character[]> {
  return prisma.character.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      systemPrompt: true,
      participationLevel: true,
      interestThreshold: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// ✅ Use batch operations
async function updateCharacters(updates: CharacterUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map(update => 
      prisma.character.update({
        where: { id: update.id },
        data: update
      })
    )
  );
}
```

---

Following these guidelines will help maintain a consistent, readable, and maintainable codebase for the Chat4 project.