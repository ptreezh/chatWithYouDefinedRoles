/**
 * 用户画像编辑器前端组件测试
 * TestCraft AI - 验证用户画像编辑器组件的正确性
 */

import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileEditor } from '../../../src/components/UserProfileEditor';

// Mock依赖
jest.mock('next-auth/react');
jest.mock('../../../src/lib/user-profile-service');
jest.mock('../../../src/hooks/useUserProfile');

describe('UserProfileEditor Component Tests', () => {
  const mockUserProfile = {
    id: 'profile_123',
    userId: 'user_123',
    demographics: {
      age: 25,
      gender: 'male',
      location: 'Beijing, China',
      language: ['zh-CN', 'en']
    },
    profession: {
      industry: 'technology',
      role: 'software_engineer',
      experience: 3,
      skills: ['JavaScript', 'React', 'Node.js']
    },
    interests: ['technology', 'reading', 'music'],
    personality: ['analytical', 'creative', 'curious'],
    behaviorPatterns: {
      loginFrequency: 'daily',
      preferredFeatures: ['chat', 'character_creation']
    },
    preferences: {
      communication: {
        style: 'casual',
        language: 'zh-CN',
        responseLength: 'detailed'
      },
      privacy: {
        profileVisibility: 'private',
        dataCollection: true,
        thirdPartySharing: false
      },
      notifications: {
        email: true,
        push: true,
        frequency: 'immediate'
      },
      aiPreferences: {
        preferredRoles: ['assistant', 'tutor'],
        interactionMode: 'collaborative',
        learningEnabled: true
      }
    }
  };

  beforeEach(() => {
    // 清理所有mock
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render user profile editor with existing profile', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('75% Complete')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument(); // age
      expect(screen.getByDisplayValue('male')).toBeInTheDocument(); // gender
    });

    it('should render empty state when no profile provided', () => {
      render(<UserProfileEditor />);

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('0% Complete')).toBeInTheDocument();
      expect(screen.getByText('Get started by filling in your information')).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      render(<UserProfileEditor isLoading={true} />);

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should show step 1 (Basic Info) by default', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByText('Basic Info (1/4)')).toBeInTheDocument();
      expect(screen.getByLabelText('Current step: 1 of 4')).toBeInTheDocument();
    });

    it('should navigate to next step when Next button is clicked', async () => {
      const { getByText, getByLabelText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      fireEvent.click(getByText('Next'));

      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
        expect(getByLabelText('Current step: 2 of 4')).toBeInTheDocument();
      });
    });

    it('should navigate to previous step when Back button is clicked', async () => {
      const { getByText, getByLabelText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      // 先进入第二步
      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      // 返回第一步
      fireEvent.click(getByText('Back'));
      await waitFor(() => {
        expect(getByText('Basic Info (1/4)')).toBeInTheDocument();
      });
    });

    it('should show completion message on last step', async () => {
      const { getByText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      // 导航到最后一步
      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Interests (3/4)')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Preferences (4/4)')).toBeInTheDocument();
        expect(getByText('Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('should render demographics fields correctly', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
      expect(screen.getByLabelText('Languages')).toBeInTheDocument();
    });

    it('should render profession fields correctly', async () => {
      const { getByText, getByLabelText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      // 导航到职业信息步骤
      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      expect(getByLabelText('Industry')).toBeInTheDocument();
      expect(getByLabelText('Role')).toBeInTheDocument();
      expect(getByLabelText('Experience')).toBeInTheDocument();
      expect(getByLabelText('Skills')).toBeInTheDocument();
    });

    it('should render interests fields correctly', async () => {
      const { getByText, getByLabelText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      // 导航到兴趣步骤
      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Interests (3/4)')).toBeInTheDocument();
      });

      expect(getByLabelText('Interests')).toBeInTheDocument();
      expect(getByLabelText('Activity Level')).toBeInTheDocument();
    });

    it('should render preferences fields correctly', async () => {
      const { getByText, getByLabelText } = render(<UserProfileEditor initialProfile={mockUserProfile} />);

      // 导航到偏好设置步骤
      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Interests (3/4)')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Next'));
      await waitFor(() => {
        expect(getByText('Preferences (4/4)')).toBeInTheDocument();
      });

      expect(getByLabelText('Communication Style')).toBeInTheDocument();
      expect(getByLabelText('Language')).toBeInTheDocument();
      expect(getByLabelText('Response Length')).toBeInTheDocument();
      expect(getByLabelText('Profile Visibility')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate age range', () => {
      render(<UserProfileEditor />);

      const ageInput = screen.getByLabelText('Age');
      
      // 输入无效年龄
      fireEvent.change(ageInput, { target: { value: '150' } });
      fireEvent.blur(ageInput);

      expect(screen.getByText('Age must be between 13 and 120')).toBeInTheDocument();
    });

    it('should validate required fields', () => {
      render(<UserProfileEditor />);

      const ageInput = screen.getByLabelText('Age');
      
      // 清空必填字段
      fireEvent.change(ageInput, { target: { value: '' } });
      fireEvent.blur(ageInput);

      expect(screen.getByText('Age is required')).toBeInTheDocument();
    });

    it('should validate email format', () => {
      render(<UserProfileEditor />);

      const emailInput = screen.getByLabelText('Email');
      
      // 输入无效邮箱
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should auto-save form data', async () => {
      const mockSaveProfile = jest.fn();
      render(<UserProfileEditor onSaveProfile={mockSaveProfile} />);

      const ageInput = screen.getByLabelText('Age');
      fireEvent.change(ageInput, { target: { value: '26' } });

      // 等待自动保存
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(mockSaveProfile).toHaveBeenCalledWith({
        demographics: { age: 26 }
      });
    });

    it('should show save success message', async () => {
      const mockSaveProfile = jest.fn().mockResolvedValue({ success: true });
      render(<UserProfileEditor onSaveProfile={mockSaveProfile} />);

      const ageInput = screen.getByLabelText('Age');
      fireEvent.change(ageInput, { target: { value: '26' } });

      await waitFor(() => {
        expect(screen.getByText('Profile saved successfully')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      const mockSaveProfile = jest.fn().mockRejectedValue(new Error('Save failed'));
      render(<UserProfileEditor onSaveProfile={mockSaveProfile} />);

      const ageInput = screen.getByLabelText('Age');
      fireEvent.change(ageInput, { target: { value: '26' } });

      await waitFor(() => {
        expect(screen.getByText('Failed to save profile')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile devices', () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // 检查移动端特定的样式
      const editor = screen.getByTestId('profile-editor');
      expect(editor).toHaveClass('mobile-layout');
    });

    it('should render correctly on tablet devices', () => {
      // 模拟平板设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // 检查平板端特定的样式
      const editor = screen.getByTestId('profile-editor');
      expect(editor).toHaveClass('tablet-layout');
    });

    it('should render correctly on desktop devices', () => {
      // 模拟桌面设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // 检查桌面端特定的样式
      const editor = screen.getByTestId('profile-editor');
      expect(editor).toHaveClass('desktop-layout');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
      expect(screen.getByLabelText('Current step: 1 of 4')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      const ageInput = screen.getByLabelText('Age');
      const nextButton = screen.getByText('Next');

      // 使用Tab键导航
      fireEvent.keyDown(ageInput, { key: 'Tab' });
      
      // 检查焦点是否正确移动
      expect(document.activeElement).toBe(nextButton);
    });

    it('should have proper color contrast', () => {
      render(<UserProfileEditor initialProfile={mockUserProfile} />);

      const heading = screen.getByText('User Profile');
      const computedStyle = window.getComputedStyle(heading);
      
      expect(computedStyle.color).not.toBe('rgb(255, 255, 255)'); // 不是白色背景上的白色文字
      expect(parseFloat(computedStyle.fontSize)).toBeGreaterThan(14); // 字体大小足够
    });
  });

  describe('Error Handling', () => {
    it('should show loading error when profile fails to load', () => {
      render(<UserProfileEditor loadError="Failed to load profile" />);

      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      expect(screen.getByText('Please try again later')).toBeInTheDocument();
    });

    it('should show network error when offline', () => {
      render(<UserProfileEditor isOnline={false} />);

      expect(screen.getByText('You are currently offline')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection')).toBeInTheDocument();
    });

    it('should show validation error for invalid data', () => {
      render(<UserProfileEditor validationErrors={['Invalid age value']} />);

      expect(screen.getByText('Invalid age value')).toBeInTheDocument();
      expect(screen.getByText('Please correct the errors below')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly with large datasets', async () => {
      const largeProfile = {
        ...mockUserProfile,
        interests: Array(100).fill('technology'),
        skills: Array(50).fill('JavaScript')
      };

      const startTime = performance.now();
      render(<UserProfileEditor initialProfile={largeProfile} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内渲染完成
    });

    it('should handle rapid form input without lag', async () => {
      render(<UserProfileEditor />);

      const ageInput = screen.getByLabelText('Age');
      
      const startTime = performance.now();
      
      // 快速输入多个值
      for (let i = 0; i < 10; i++) {
        fireEvent.change(ageInput, { target: { value: i.toString() } });
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // 应该在500ms内处理完所有输入
    });
  });

  describe('Integration with Backend', () => {
    it('should call onSaveProfile when form is submitted', async () => {
      const mockSaveProfile = jest.fn().mockResolvedValue({ success: true });
      render(<UserProfileEditor onSaveProfile={mockSaveProfile} initialProfile={mockUserProfile} />);

      // 导航到最后一步
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Interests (3/4)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Preferences (4/4)')).toBeInTheDocument();
      });

      // 提交表单
      fireEvent.click(screen.getByText('Complete'));

      await waitFor(() => {
        expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({
          demographics: expect.any(Object),
          profession: expect.any(Object),
          interests: expect.any(Array),
          preferences: expect.any(Object)
        }));
      });
    });

    it('should handle backend errors gracefully', async () => {
      const mockSaveProfile = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<UserProfileEditor onSaveProfile={mockSaveProfile} initialProfile={mockUserProfile} />);

      // 尝试提交表单
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Profession Info (2/4)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Interests (3/4)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Preferences (4/4)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Complete'));

      await waitFor(() => {
        expect(screen.getByText('Failed to save profile')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});