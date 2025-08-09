# Contributing to Chat4

We love your input! We want to make contributing to Chat4 as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 📋 Development Process

We use a simple git flow for development:

1. **Fork** the repo on GitHub
2. **Clone** the project to your local machine
3. **Configure** the upstream repository
4. **Create** a new feature branch
5. **Make** your changes
6. **Test** your changes
7. **Commit** your changes
8. **Push** to your fork
9. **Submit** a pull request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn
- Git
- Ollama (for testing local LLM features)

### Setup Steps

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/your-username/chat4.git
   cd chat4
   ```

2. **Configure Upstream**
   ```bash
   git remote add upstream https://github.com/original-username/chat4.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📝 Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Provide explicit return types for functions
- Use interfaces for object shapes
- Avoid `any` type when possible

### React Components
- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow the established naming conventions
- Use the existing shadcn/ui components when possible

### File Organization
- Keep files organized in the established directory structure
- Use descriptive file names
- Group related functionality together

### Naming Conventions
- **Components**: PascalCase (e.g., `CharacterManager`)
- **Files**: kebab-case for UI components, camelCase for utilities
- **Functions**: camelCase (e.g., `handleSendMessage`)
- **Variables**: camelCase, descriptive names
- **Constants**: UPPER_SNAKE_CASE

### Comments and Documentation
- Use JSDoc comments for functions and classes
- Comment complex logic
- Keep comments up-to-date with code changes

## 🧪 Testing Guidelines

### Running Tests
```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:e2e        # End-to-end tests
npm run test:performance # Performance tests
npm run test:basic       # Basic functionality tests
```

### Writing Tests
- Write tests for new features
- Aim for high test coverage
- Test both success and error cases
- Use descriptive test names

### Test Structure
```
tests/
├── e2e/           # End-to-end tests
├── integration/   # Integration tests
├── unit/          # Unit tests
└── performance/   # Performance tests
```

## 🤝 Pull Request Process

### 1. Creating a Pull Request

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the code style guidelines
   - Write tests for new features
   - Update documentation as needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature name"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill in the PR template
   - Link to any relevant issues

### 2. Pull Request Template

```markdown
## 📋 Description
Please include a summary of the change and which issue is fixed.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing
Please describe the tests that you ran to verify your changes:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## 📋 Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
```

### 3. Review Process

1. **Automated Checks**
   - All tests must pass
   - Code must follow style guidelines
   - Documentation must be updated

2. **Code Review**
   - At least one maintainer must review the PR
   - Address any review comments
   - Update tests as needed

3. **Merge**
   - Once approved, the PR will be merged
   - Delete the feature branch if no longer needed

## 🐛 Reporting Bugs

Bug reports are welcome! To make reporting easier, please include:

### Bug Report Template

```markdown
## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## 💻 Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 🖥️ Environment
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]
- Node.js version [e.g. 18.0.0]

## 📝 Additional Context
Add any other context about the problem here.
```

## ✨ Feature Requests

We welcome feature requests! Please use the following template:

```markdown
## 🎯 Feature Description
A clear and concise description of what you want to happen.

## 🎨 Proposed Solution
Describe the solution you'd like to see implemented.

## 🔄 Alternatives
Describe any alternative solutions or features you've considered.

## 📈 Additional Context
Add any other context, screenshots, or examples about the feature request.
```

## 🏷️ Labels

We use labels to categorize issues and pull requests:

- `bug` - Bug reports
- `enhancement` - Feature requests
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra help is needed
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

## 🤝 Becoming a Maintainer

We're always looking for new maintainers! If you're interested in helping maintain Chat4:

1. **Be Active** - Contribute regularly and help others
2. **Know the Codebase** - Understand the architecture and patterns
3. **Review PRs** - Help review pull requests
4. **Help with Issues** - Assist with bug reports and questions
5. **Be Responsive** - Respond to mentions and requests in a timely manner

If you're interested in becoming a maintainer, please reach out to the current maintainers.

## 📞 Getting Help

If you need help with contributing:

1. **Check the Documentation** - Start with our [documentation](docs/)
2. **Search Existing Issues** - Your question may have been answered before
3. **Join Discussions** - Participate in GitHub Discussions
4. **Ask in Issues** - Create a new issue with the "question" label

## 📄 License

By contributing to Chat4, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Chat4! 🎉