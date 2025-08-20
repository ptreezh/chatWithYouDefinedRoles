# 用户界面设计规范 (精简版)

## 🎨 设计原则 (KISS)

### 用户体验优先 (KISS)
- **简洁直观**: 界面设计简洁明了，用户能够快速理解和使用核心功能。
- **一致性**: 整个平台的视觉风格和交互方式保持一致。
- **响应式**: 适配不同设备和屏幕尺寸（优先PC，兼容移动端）。

### 现代化设计 (KISS)
- **基础Material Design**: 采用简洁的Material Design元素。
- **主题切换**: 支持基础的明暗主题切换。
- **微交互**: 关键操作有适度的反馈。

---

## 🏠 主界面设计 (KISS)

### 仪表板布局 (KISS)
```typescript
interface DashboardLayout {
  header: {
    logo: string;
    userMenu: UserMenuItem[]; // 个人资料, 登出
  };
  sidebar: {
    mainSections: Section[]; // 聊天室, 角色管理
  };
  mainContent: {
    welcomeSection: WelcomeSection; // 欢迎信息
    quickStart: QuickStartGuide[]; // 快速开始引导 (创建聊天室, 上传角色)
  };
}
```

### 响应式断点 (KISS)
```css
/* 移动端 */
@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
  .sidebar { display: none; } /* 移动端菜单通过汉堡按钮展开 */
}

/* 桌面端 */
@media (min-width: 769px) {
  .dashboard { grid-template-columns: 250px 1fr; }
  .sidebar { width: 250px; }
}
```

---

## 🔐 认证界面设计 (KISS)

### 登录/注册页面 (KISS)
```typescript
interface AuthPage {
  layout: {
    formSection: {
      title: string; // 登录 / 注册
      emailField: FormField;
      passwordField: FormField;
      confirmPasswordField?: FormField; // 仅注册时
      submitButton: Button;
      socialLogin: SocialLoginButton[]; // Google, (GitHub)
      links: {
        forgotPassword?: string; // 可选
        signUpOrIn: string; // 切换到注册/登录
      };
    };
    heroSection?: { // 可选的介绍区域
      title: string;
      subtitle: string;
    };
  };
}
```

---

## 👤 用户管理界面 (KISS)

### 个人资料页面 (KISS)
```typescript
interface ProfilePage {
  sections: {
    basicInfo: {
      avatar: AvatarUploader;
      nameField: TextField; // 昵称
      emailField: TextField; // 只读
    };
    security: {
      changePassword: ChangePasswordForm; // 修改密码
      connectedAccounts: ConnectedAccountsList; // OAuth账户
      deleteAccount: DeleteAccountButton; // 删除账户
    };
  };
}
```

---

## 💬 聊天室界面 (核心)

### 聊天室主界面 (KISS)
```typescript
interface ChatRoomInterface {
  layout: {
    sidebar: {
      roomList: ChatRoom[]; // 用户的聊天室列表
      createRoomButton: Button; // 创建新聊天室
    };
    mainArea: {
      header: {
        roomInfo: RoomInfo; // 聊天室名称
        actions: ActionButton[]; // 删除聊天室
      };
      messages: MessageList; // 消息展示区
      inputArea: MessageInput; // 消息输入区
    };
    rightPanel: {
      roleSelector: RoleSelector; // 选择/切换AI角色
      roomSettings?: RoomSettings; // 基础设置 (可选)
    };
  };
}
```

### 消息组件设计 (KISS)
```typescript
interface MessageComponent {
  variants: {
    text: TextMessage; // 基础文本消息
    system: SystemMessage; // 系统消息 (如"AI正在思考")
  };
  states: {
    sending: 'sending';
    sent: 'sent';
    failed: 'failed';
  };
}
```

---

## 🤖 角色管理界面 (核心)

### 角色列表页面 (KISS)
```typescript
interface CharacterManagementPage {
  layout: {
    header: {
      title: string; // "我的角色"
      uploadButton: Button; // 上传新角色
    };
    content: {
      characterGrid: CharacterCard[]; // 角色卡片列表
    };
  };
}

interface CharacterCard {
  avatar: string;
  name: string;
  lastModified: string;
  actions: {
    edit: Action; // 编辑基础信息
    delete: Action; // 删除角色
  };
}
```

### 角色上传/创建界面 (KISS)
```typescript
interface CharacterUploadPage {
  steps: {
    fileUpload: {
      uploader: FileUploader; // 上传角色文件
    };
    basicInfo: {
      nameField: TextField; // 角色名称
      descriptionField: TextArea; // 简单描述
    };
    confirm: {
      review: ReviewSection; // 预览信息
      submitButton: Button; // 确认创建
    };
  };
}
```

---

## 🎨 组件设计系统 (KISS)

### 基础组件 (KISS)
```typescript
interface DesignSystem {
  colors: {
    primary: string; // 主色调
    secondary: string; // 辅助色
    background: string; // 背景色
    text: string; // 文字色
    success: string; // 成功状态色
    error: string; // 错误状态色
  };
  typography: {
    fontFamily: string; // 主字体
    sizes: { small: string; base: string; large: string; xl: string; };
  };
  spacing: {
    unit: number; // 基础间距单位
  };
  shadows: {
    card: string; // 卡片阴影
    focus: string; // 焦点阴影
  };
}
```

### 表单组件 (KISS)
```typescript
interface FormComponents {
  input: {
    text: TextInput;
    email: EmailInput;
    password: PasswordInput;
  };
  button: {
    primary: Button;
    secondary: Button;
    danger: Button; // 用于删除等危险操作
  };
  file: {
    upload: FileUpload; // 文件上传
  };
}
```

### 反馈组件 (KISS)
```typescript
interface FeedbackComponents {
  notification: {
    types: {
      success: Notification;
      error: Notification;
      info: Notification;
    };
  };
  modal: {
    confirm: ConfirmModal; // 确认对话框 (如删除确认)
  };
}
```

---

## 📱 移动端适配 (KISS)

### 移动端聊天界面 (KISS)
```typescript
interface MobileChatInterface {
  layout: {
    header: {
      backButton: Button; // 返回聊天室列表
      roomInfo: RoomInfo;
      menuButton: Button; // 打开菜单 (角色选择, 聊天室设置)
    };
    messages: MessageList;
    inputArea: {
      textField: TextField;
      sendButton: Button;
    };
  };
}
```

---

## ♿ 可访问性设计 (基础)

### 基础可访问性 (KISS)
- **语义化HTML**: 使用正确的HTML标签。
- **Alt文本**: 为所有图片提供Alt文本。
- **键盘导航**: 确保主要功能可以通过Tab键访问。
- **对比度**: 确保文字与背景有足够对比度。

---

## 🎭 主题系统 (KISS)

### 基础主题切换 (KISS)
```typescript
interface ThemeSystem {
  themes: {
    light: Theme;
    dark: Theme;
  };
  mode: {
    current: 'light' | 'dark';
    toggle: ThemeToggle; // 切换按钮
  };
}
```

---

## 📋 总结

本用户界面设计规范为多用户认证系统扩充提供了**简洁、聚焦核心功能**的界面设计指导。通过KISS原则，我们能够：

1.  **快速实现价值**: 优先设计和开发用户最需要的核心功能界面。
2.  **降低复杂性**: 避免过早引入复杂的设计元素和交互。
3.  **保持一致性**: 统一的设计语言和组件系统，提升用户体验。
4.  **支持未来扩展**: 简洁的设计为未来添加新功能（如人格标签、高级角色市场）预留了空间。

该设计规范将确保Chat4平台在功能扩充的同时，提供一个**简单、直观、高效**的用户界面。

---

**设计规范版本**: 1.1 (精简版)
**创建日期**: 2025-08-20
**设计团队**: UI/UX设计组