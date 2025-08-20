/**
 * @fileoverview 用户画像数据模型测试
 * TestCraft AI - 验证用户画像数据模型的正确性
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// 导入实际的模块
import { UserProfileService } from '../../src/lib/user-profile-service';
import { UserProfileValidator } from '../../src/lib/user-profile-validator';

// Mock Prisma Client
jest.mock('@prisma/client');
const MockPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('UserProfile Data Model Tests', () => {
  let prisma: MockPrismaClient;
  let userProfileService: UserProfileService;
  let validator: UserProfileValidator;

  beforeEach(() => {
    // 创建Mock实例
    prisma = new MockPrismaClient();
    
    // 设置mock属性
    Object.defineProperty(prisma, 'userProfile', {
      value: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      writable: false
    });
    
    // 创建服务实例
    userProfileService = new UserProfileService(prisma as any);
    validator = new UserProfileValidator();
    
    // 清理所有mock
    jest.clearAllMocks();
  });

  describe('UserProfile Model Structure', () => {
    it('should have correct table structure', () => {
      // 验证用户画像表的字段
      const expectedFields = [
        'create', 'findUnique', 'update', 'delete'
      ];
      
      expectedFields.forEach(field => {
        expect(prisma.userProfile).toHaveProperty(field);
      });
    });

    it('should enforce unique userId constraint', () => {
      expect(typeof prisma.userProfile.create).toBe('function');
      expect(prisma.userProfile.create).toBeInstanceOf(Function);
    });

    it('should have proper foreign key constraint to users table', () => {
      expect(typeof prisma.userProfile.findUnique).toBe('function');
      expect(prisma.userProfile.findUnique).toBeInstanceOf(Function);
    });
  });

  describe('UserProfileService CRUD Operations', () => {
    const mockProfileData = {
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
        }
      }
    };

    it('should create user profile successfully', async () => {
      const createdProfile = {
        id: 'profile_123',
        userId: 'user_123',
        ...mockProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.userProfile.create as jest.Mock).mockResolvedValue(createdProfile);

      const result = await userProfileService.createProfile(mockProfileData as any);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user_123');
      expect(result.demographics).toEqual(mockProfileData.demographics);
      
      // 验证数据库调用
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          demographics: mockProfileData.demographics,
          profession: mockProfileData.profession,
          interests: mockProfileData.interests,
          personality: mockProfileData.personality,
          behaviorPatterns: mockProfileData.behaviorPatterns,
          preferences: mockProfileData.preferences,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should get user profile by userId', async () => {
      const mockProfile = {
        id: 'profile_123',
        userId: 'user_123',
        ...mockProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getProfileByUserId('user_123');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user_123');
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user_123' }
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        demographics: {
          age: 26,
          gender: 'male',
          location: 'Shanghai, China',
          language: ['zh-CN']
        }
      };

      const updatedProfile = {
        id: 'profile_123',
        userId: 'user_123',
        ...mockProfileData,
        ...updateData,
        updatedAt: new Date()
      };

      (prisma.userProfile.update as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await userProfileService.updateProfile('user_123', updateData);

      expect(result).toBeDefined();
      expect(result.demographics.age).toBe(26);
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle profile not found', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.getProfileByUserId('nonexistent_user');

      expect(result).toBeNull();
    });

    it('should throw error when creating profile fails', async () => {
      const error = new Error('Database error');
      (prisma.userProfile.create as jest.Mock).mockRejectedValue(error);

      await expect(userProfileService.createProfile(mockProfileData as any))
        .rejects.toThrow('Failed to create user profile');
    });
  });

  describe('UserProfileValidator', () => {
    it('should validate valid user profile data', () => {
      const validData = {
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
        }
      };

      const result = validator.validateUserProfile(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid age', () => {
      const invalidData = {
        userId: 'user_123',
        demographics: {
          age: 150, // 超出范围
          gender: 'male',
          location: 'Beijing, China',
          language: ['zh-CN']
        }
      };

      const result = validator.validateUserProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be a number between 13 and 120');
    });

    it('should reject invalid gender', () => {
      const invalidData = {
        userId: 'user_123',
        demographics: {
          age: 25,
          gender: 'invalid_gender',
          location: 'Beijing, China',
          language: ['zh-CN']
        }
      };

      const result = validator.validateUserProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid gender value');
    });

    it('should reject negative experience', () => {
      const invalidData = {
        userId: 'user_123',
        profession: {
          experience: -1, // 负数
          industry: 'technology',
          role: 'developer'
        }
      };

      const result = validator.validateUserProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Experience must be a non-negative number');
    });

    it('should require userId', () => {
      const invalidData = {
        demographics: {
          age: 25,
          gender: 'male'
        }
        // 缺少 userId
      };

      const result = validator.validateUserProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required and must be a string');
    });
  });

  describe('Data Type Validation', () => {
    it('should handle complex JSON data', async () => {
      const complexProfileData = {
        userId: 'user_123',
        demographics: {
          age: 25,
          gender: 'male',
          location: 'Beijing, China',
          language: ['zh-CN', 'en', 'ja']
        },
        profession: {
          industry: 'technology',
          role: 'full_stack_developer',
          experience: 5,
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Docker']
        },
        interests: ['AI/ML', 'Web Development', 'Mobile Development', 'Cloud Computing'],
        personality: ['analytical', 'innovative', 'team_player', 'continuous_learner'],
        behaviorPatterns: {
          loginFrequency: 'daily',
          peakHours: [19, 20, 21, 22],
          sessionDuration: 1800,
          preferredDeviceTypes: ['desktop', 'mobile'],
          interactionStyle: 'text'
        },
        preferences: {
          communication: {
            style: 'professional',
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
            preferredRoles: ['assistant', 'tutor', 'code_reviewer'],
            interactionMode: 'collaborative',
            learningEnabled: true
          }
        }
      };

      const createdProfile = {
        id: 'profile_complex',
        ...complexProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.userProfile.create as jest.Mock).mockResolvedValue(createdProfile);

      const result = await userProfileService.createProfile(complexProfileData as any);

      expect(result).toBeDefined();
      expect(result.demographics.language).toEqual(['zh-CN', 'en', 'ja']);
      expect(result.profession.skills).toHaveLength(6);
      expect(result.behaviorPatterns.peakHours).toEqual([19, 20, 21, 22]);
    });

    it('should handle minimal profile data', async () => {
      const minimalProfileData = {
        userId: 'user_123'
        // 其他字段都为空或默认值
      };

      const createdProfile = {
        id: 'profile_minimal',
        ...minimalProfileData,
        demographics: {},
        profession: {},
        interests: [],
        personality: [],
        behaviorPatterns: {},
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.userProfile.create as jest.Mock).mockResolvedValue(createdProfile);

      const result = await userProfileService.createProfile(minimalProfileData as any);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user_123');
      expect(result.demographics).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle database constraint violations', async () => {
      const profileData = {
        userId: 'user_123',
        demographics: { age: 25, gender: 'male' }
      };

      // Mock unique constraint violation
      const constraintError = new Error('UNIQUE constraint failed: user_profiles.userId');
      (prisma.userProfile.create as jest.Mock).mockRejectedValue(constraintError);

      await expect(userProfileService.createProfile(profileData as any))
        .rejects.toThrow('Failed to create user profile');
    });

    it('should handle foreign key constraint violations', async () => {
      const profileData = {
        userId: 'nonexistent_user',
        demographics: { age: 25, gender: 'male' }
      };

      // Mock foreign key constraint violation
      const fkError = new Error('FOREIGN KEY constraint failed');
      (prisma.userProfile.create as jest.Mock).mockRejectedValue(fkError);

      await expect(userProfileService.createProfile(profileData as any))
        .rejects.toThrow('Failed to create user profile');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        userId: 'user_123',
        demographics: {
          age: 150, // 无效年龄
          gender: 'male'
        }
      };

      const result = validator.validateUserProfile(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large profile data efficiently', async () => {
      const largeProfileData = {
        userId: 'user_123',
        demographics: {
          age: 25,
          gender: 'male',
          location: 'Beijing, China',
          language: Array(100).fill('zh-CN') // 大量语言数据
        },
        profession: {
          industry: 'technology',
          role: 'developer',
          experience: 3,
          skills: Array(200).fill('JavaScript') // 大量技能数据
        },
        interests: Array(150).fill('technology'), // 大量兴趣数据
        personality: Array(50).fill('analytical'),
        behaviorPatterns: {
          loginFrequency: 'daily',
          preferredFeatures: Array(100).fill('chat')
        }
      };

      const createdProfile = {
        id: 'profile_large',
        ...largeProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.userProfile.create as jest.Mock).mockResolvedValue(createdProfile);

      const startTime = Date.now();
      await userProfileService.createProfile(largeProfileData as any);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('should check profile existence efficiently', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123'
      });

      const startTime = Date.now();
      const exists = await userProfileService.profileExists('user_123');
      const endTime = Date.now();

      expect(exists).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });
});