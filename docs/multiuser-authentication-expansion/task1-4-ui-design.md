# UI界面设计文档

**任务ID**: TASK-1.4  
**负责人**: UI/UX设计师  
**开始时间**: 2025-08-20 17:20  
**预计完成**: 2025-08-21 01:20  
**当前状态**: 进行中  

## 📋 概述

基于用户画像需求和API设计，设计用户画像管理系统的用户界面，确保良好的用户体验和响应式设计。

## 🎨 设计原则

### 用户体验原则
- **简洁直观**: 界面简洁，操作直观
- **渐进式引导**: 分步骤引导用户完善画像
- **即时反馈**: 操作后提供即时反馈
- **一致性**: 与现有系统保持一致性

### 视觉设计原则
- **Material Design 3**: 采用Material Design 3设计语言
- **响应式设计**: 适配桌面、平板、手机
- **可访问性**: 符合WCAG 2.1标准
- **暗色模式**: 支持明暗主题切换

## 🖼️ 界面设计

### 1. 用户画像编辑器

#### 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│  用户画像设置                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │                 │  │                               │   │
│  │   进度指示器     │  │        用户头像               │   │
│  │   75% 完成      │  │        [上传头像]              │   │
│  │                 │  │                               │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  基本信息 (1/4)                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  年龄:      │  │  性别:      │                           │
│  │  [25]       │  │  [男]       │                           │
│  └─────────────┘  └─────────────┘                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  地理位置: [Beijing, China] ___________________         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  语言偏好:                                             │   │
│  │  ☑ 中文  ☑ English                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]  [下一步]  [保存草稿]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 步骤导航
```typescript
interface ProfileSteps {
  basic: {
    title: "基本信息"
    icon: "person"
    fields: ["age", "gender", "location", "language"]
  }
  profession: {
    title: "职业信息"
    icon: "work"
    fields: ["industry", "role", "experience", "skills"]
  }
  interests: {
    title: "兴趣爱好"
    icon: "interests"
    fields: ["categories", "tags"]
  }
  preferences: {
    title: "偏好设置"
    icon: "settings"
    fields: ["communication", "privacy", "notifications"]
  }
}
```

### 2. 职业信息界面

#### 职业表单设计
```
┌─────────────────────────────────────────────────────────────┐
│  职业信息 (2/4)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  行业领域:                                             │   │
│  │  [技术 ▼]                                              │   │
│  │  • 技术                                                 │   │
│  │  • 教育                                                 │   │
│  │  • 医疗                                                 │   │
│  │  • 金融                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  职位角色: [软件工程师] ___________________           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  工作经验:                                             │   │
│  │  [0] 年  [1-3年]  [4-6年]  [7-10年]  [10+年]           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  技能标签:                                             │   │
│  │  [JavaScript] [React] [Node.js] [+]                    │   │
│  │                                                         │   │
│  │  建议技能:                                             │   │
│  │  [TypeScript] [Python] [Docker] [Vue]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]  [下一步]  [保存草稿]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 兴趣爱好界面

#### 兴趣选择设计
```
┌─────────────────────────────────────────────────────────────┐
│  兴趣爱好 (3/4)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  选择感兴趣的类别:                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  科技   │ │  阅读   │ │  音乐   │ │  运动   │           │
│  │         │ │         │ │         │ │         │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  旅行   │ │  摄影   │ │  美食   │ │  游戏   │           │
│  │         │ │         │ │         │ │         │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  自定义标签:                                           │   │
│  │  [AI] [机器学习] [Web开发] [+]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  活跃程度:                                             │   │
│  │  [低] [中等] [高]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]  [下一步]  [保存草稿]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. 偏好设置界面

#### 偏好设置设计
```
┌─────────────────────────────────────────────────────────────┐
│  偏好设置 (4/4)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  沟通偏好                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  沟通风格: [正式] [随意] [专业]                            │
│  首选语言: [中文] [English]                              │
│  回应长度: [简洁] [详细]                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  隐私设置                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  资料可见性: [公开] [仅好友] [私密]                        │
│  数据收集: [☑ 允许] [□ 不允许]                            │
│  第三方共享: [□ 允许] [☑ 不允许]                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  通知设置                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  邮件通知: [☑ 开启] [□ 关闭]                              │
│  推送通知: [☑ 开启] [□ 关闭]                              │
│  通知频率: [即时] [每日摘要] [每周摘要]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI偏好                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  偏好角色: [助手] [导师] [创意伙伴]                        │
│  交互模式: [协作式] [指导式]                              │
│  学习功能: [☑ 开启] [□ 关闭]                              │
│                                                             │
│  [上一步]  [完成]  [保存草稿]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. 设备管理界面

#### 设备列表设计
```
┌─────────────────────────────────────────────────────────────┐
│  设备管理                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  当前设备                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💻 此设备 (Windows Chrome)                            │   │
│  │  最后使用: 刚刚                                        │   │
│  │  状态: 已信任 ✓                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  其他设备                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📱 iPhone 14 Pro                                       │   │
│  │  最后使用: 2小时前                                    │   │
│  │  状态: 已信任 ✓    [移除]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💻 MacBook Pro                                        │   │
│  │  最后使用: 1天前                                     │   │
│  │  状态: 未信任    [信任] [移除]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  [管理信任设备]  [注销所有其他设备]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📱 响应式设计

### 移动端适配
```css
/* 移动端样式 */
@media (max-width: 768px) {
  .profile-editor {
    padding: 16px;
  }
  
  .step-navigation {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .interest-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 平板端样式 */
@media (min-width: 769px) and (max-width: 1024px) {
  .profile-editor {
    padding: 24px;
  }
  
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .interest-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 桌面端样式 */
@media (min-width: 1025px) {
  .profile-editor {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px;
  }
  
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .interest-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## 🎨 组件设计

### 1. 进度指示器组件
```typescript
interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="progress-text">
        {currentStep} / {totalSteps} 完成
      </div>
      <div className="step-indicators">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-indicator ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
          >
            <step.icon />
            <span>{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. 标签输入组件
```typescript
interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder: string
}

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder
}) => {
  const [inputValue, setInputValue] = useState('')
  
  const handleAddTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setInputValue('')
    }
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }
  
  return (
    <div className="tag-input-container">
      <div className="tag-list">
        {value.map(tag => (
          <div key={tag} className="tag">
            {tag}
            <button onClick={() => handleRemoveTag(tag)}>×</button>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && inputValue) {
            handleAddTag(inputValue)
          }
        }}
        placeholder={placeholder}
      />
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions
            .filter(suggestion => 
              !value.includes(suggestion) && 
              suggestion.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(suggestion => (
              <div
                key={suggestion}
                className="suggestion-item"
                onClick={() => handleAddTag(suggestion)}
              >
                {suggestion}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
```

### 3. 设备卡片组件
```typescript
interface DeviceCardProps {
  device: Device
  isCurrentDevice: boolean
  onTrust: (deviceId: string) => void
  onRemove: (deviceId: string) => void
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isCurrentDevice,
  onTrust,
  onRemove
}) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return '📱'
      case 'tablet': return '📟'
      case 'desktop': return '💻'
      default: return '🖥️'
    }
  }
  
  return (
    <div className={`device-card ${isCurrentDevice ? 'current' : ''}`}>
      <div className="device-info">
        <div className="device-icon">
          {getDeviceIcon(device.deviceType)}
        </div>
        <div className="device-details">
          <div className="device-name">
            {device.deviceName || `${device.deviceType} ${device.deviceInfo?.platform}`}
          </div>
          <div className="device-meta">
            最后使用: {formatDate(device.lastUsedAt)}
          </div>
          {device.isTrusted && (
            <div className="device-status trusted">
              ✓ 已信任
            </div>
          )}
        </div>
      </div>
      
      {!isCurrentDevice && (
        <div className="device-actions">
          {!device.isTrusted && (
            <button
              className="btn-trust"
              onClick={() => onTrust(device.id)}
            >
              信任
            </button>
          )}
          <button
            className="btn-remove"
            onClick={() => onRemove(device.id)}
          >
            移除
          </button>
        </div>
      )}
    </div>
  )
}
```

## 🔧 交互设计

### 1. 表单验证
```typescript
interface FormValidation {
  validateField: (field: string, value: any) => ValidationError[]
  validateForm: (data: FormData) => FormValidationResult
  showErrors: boolean
}
```

### 2. 自动保存
```typescript
interface AutoSave {
  enabled: boolean
  interval: number // 30 seconds
  onSave: (data: FormData) => Promise<void>
  lastSaved: Date | null
}
```

### 3. 键盘导航
```typescript
interface KeyboardNavigation {
  tabOrder: string[]
  shortcuts: {
    next: 'Tab' | 'ArrowRight'
    previous: 'Shift+Tab' | 'ArrowLeft'
    submit: 'Enter' | 'Ctrl+Enter'
    cancel: 'Escape'
  }
}
```

## ♿ 可访问性设计

### 1. 键盘导航
- Tab键顺序合理
- 快捷键支持
- 焦点状态可见

### 2. 屏幕阅读器
- ARIA标签
- 语义化HTML
- 状态变化通知

### 3. 视觉辅助
- 高对比度模式
- 字体大小调整
- 颜色编码替代

## 🎭 主题系统

### 颜色变量
```css
:root {
  /* 主色调 */
  --primary-color: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  
  /* 次要色调 */
  --secondary-color: #06b6d4;
  --secondary-light: #22d3ee;
  --secondary-dark: #0891b2;
  
  /* 中性色 */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-disabled: #9ca3af;
  
  /* 背景色 */
  --background: #ffffff;
  --surface: #f9fafb;
  --border: #e5e7eb;
  
  /* 状态色 */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}

/* 暗色主题 */
[data-theme="dark"] {
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-disabled: #9ca3af;
  
  --background: #111827;
  --surface: #1f2937;
  --border: #374151;
}
```

---

**文档状态**: 草稿 (需要用户体验评审)  
**下次更新**: 2025-08-20 20:00  
**评审人员**: UX设计师、前端开发负责人