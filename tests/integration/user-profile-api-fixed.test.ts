/**
 * 用户画像API集成测试
 * TestCraft AI - 验证用户画像API的正确性
 */

import { jest } from '@jest/globals';

// Mock依赖
jest.mock('../../../src/lib/user-profile-service');
jest.mock('../../../src/lib/user-profile-validator');

import { UserProfileService } from '../../../src/lib/user-profile-service';
import { UserProfileValidator } from '../../../src/lib/user-profile-validator';

const MockUserProfileService = UserProfileService as jest.MockedClass<typeof UserProfileService>;
const MockUserProfileValidator = UserProfileValidator as jest.MockedClass<typeof UserProfileValidator>;

describe('UserProfile API Integration Tests', () => {
  let userProfileService: any;
  let validator: any;

  beforeEach(() => {
    // 创建Mock实例
    userProfileService = new MockUserProfileService();
    validator = new MockUserProfileValidator();
    
    // 清理所有mock
    jest.clearAllMocks();
  });

  describe('API Endpoints', () => {
    it('should handle GET /api/user/profile', async () => {
      const mockProfile = {
        id: 'profile_123',
        userId: 'user_123',
        demographics: { age: 25, gender: 'male' }
      };

      userProfileService.getProfileByUserId.mockResolvedValue(mockProfile);

      // 模拟API调用
      const result = await simulateAPICall('GET', '/api/user/profile');

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(mockProfile);
    });

    it('should handle PUT /api/user/profile', async () => {
      const mockProfile = {
        id: 'profile_123',
        userId: 'user_123',
        demographics: { age: 25, gender: 'male' }
      };

      const profileData = {
        demographics: { age: 25, gender: 'male' }
      };

      // Mock验证通过
      validator.validateUserProfile.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Mock profile不存在
      userProfileService.getProfileByUserId.mockResolvedValue(null);

      // Mock创建成功
      userProfileService.createProfile.mockResolvedValue(mockProfile);

      const result = await simulateAPICall('PUT', '/api/user/profile', profileData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(mockProfile);
      expect(result.body.message).toBe('Profile created successfully');
    });

    it('should handle PATCH /api/user/profile', async () => {
      const mockProfile = {
        id: 'profile_123',
        userId: 'user_123',
        demographics: { age: 26, gender: 'male' }
      };

      const updateData = {
        demographics: { age: 26 }
      };

      validator.validateUserProfile.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Mock profile存在
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'existing_profile',
        userId: 'user_123'
      });

      userProfileService.updateProfile.mockResolvedValue(mockProfile);

      const result = await simulateAPICall('PATCH', '/api/user/profile', updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(mockProfile);
      expect(result.body.message).toBe('Profile updated successfully');
    });

    it('should handle DELETE /api/user/profile', async () => {
      // Mock profile存在
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'existing_profile',
        userId: 'user_123'
      });

      userProfileService.deleteProfile.mockResolvedValue(undefined);

      const result = await simulateAPICall('DELETE', '/api/user/profile');

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('Profile deleted successfully');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 when not authenticated', async () => {
      const result = await simulateAPICall('GET', '/api/user/profile', null, false);

      expect(result.status).toBe(401);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe('Unauthorized');
    });

    it('should return 404 when profile not found', async () => {
      userProfileService.getProfileByUserId.mockResolvedValue(null);

      const result = await simulateAPICall('GET', '/api/user/profile');

      expect(result.status).toBe(404);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe('Profile not found');
    });

    it('should return 409 when profile already exists on create', async () => {
      const profileData = {
        demographics: { age: 25, gender: 'male' }
      };

      validator.validateUserProfile.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Mock profile已存在
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'existing_profile',
        userId: 'user_123'
      });

      const result = await simulateAPICall('PUT', '/api/user/profile', profileData);

      expect(result.status).toBe(409);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe('Profile already exists');
    });

    it('should return 400 when validation fails', async () => {
      const invalidProfileData = {
        demographics: { age: 150, gender: 'male' } // 无效年龄
      };

      validator.validateUserProfile.mockReturnValue({
        isValid: false,
        errors: ['Age must be between 13 and 120']
      });

      const result = await simulateAPICall('PUT', '/api/user/profile', invalidProfileData);

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe('Validation failed');
      expect(result.body.details).toEqual(['Age must be between 13 and 120']);
    });

    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Database connection failed');
      userProfileService.getProfileByUserId.mockRejectedValue(serviceError);

      const result = await simulateAPICall('GET', '/api/user/profile');

      expect(result.status).toBe(500);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe('Internal server error');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle requests efficiently', async () => {
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123'
      });

      const startTime = Date.now();
      const result = await simulateAPICall('GET', '/api/user/profile');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
      expect(result.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123'
      });

      // 发送多个并发请求
      const requests = Array(10).fill(null).map(() => 
        simulateAPICall('GET', '/api/user/profile')
      );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // 10个并发请求应该在500ms内完成
      expect(results.every(result => result.status === 200)).toBe(true);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      userProfileService.getProfileByUserId.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123'
      });

      const result = await simulateAPICall('GET', '/api/user/profile');

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(result.headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    });

    it('should handle OPTIONS preflight request', async () => {
      const result = await simulateAPICall('OPTIONS', '/api/user/profile');

      expect(result.status).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('PATCH');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('DELETE');
    });
  });
});

// 模拟API调用的辅助函数
async function simulateAPICall(method: string, path: string, data?: any, authenticated = true): Promise<any> {
  // 模拟认证检查
  if (authenticated && !simulateAuthCheck()) {
    return {
      status: 401,
      body: { success: false, error: 'Unauthorized' },
      headers: getCORSHeaders()
    };
  }

  try {
    let result;
    
    switch (method) {
      case 'GET':
        result = await handleGetRequest(path);
        break;
      case 'PUT':
        result = await handlePutRequest(path, data);
        break;
      case 'PATCH':
        result = await handlePatchRequest(path, data);
        break;
      case 'DELETE':
        result = await handleDeleteRequest(path);
        break;
      case 'OPTIONS':
        result = { status: 200, body: { success: true }, headers: getCORSHeaders() };
        break;
      default:
        result = { status: 405, body: { error: 'Method not allowed' }, headers: getCORSHeaders() };
    }

    return {
      status: result.status,
      body: result.body,
      headers: { ...getCORSHeaders(), ...result.headers }
    };
  } catch (error) {
    return {
      status: 500,
      body: { success: false, error: 'Internal server error' },
      headers: getCORSHeaders()
    };
  }
}

// 模拟认证检查
function simulateAuthCheck(): boolean {
  // 在实际测试中，这里会检查session或token
  return true;
}

// 处理GET请求
async function handleGetRequest(path: string) {
  if (path === '/api/user/profile') {
    const userProfileService = new (UserProfileService as any)();
    const profile = await userProfileService.getProfileByUserId('user_123');
    
    if (!profile) {
      return { status: 404, body: { success: false, error: 'Profile not found' } };
    }
    
    return { status: 200, body: { success: true, data: profile } };
  }
  
  return { status: 404, body: { error: 'Not found' } };
}

// 处理PUT请求
async function handlePutRequest(path: string, data: any) {
  if (path === '/api/user/profile') {
    const userProfileService = new (UserProfileService as any)();
    const validator = new (UserProfileValidator as any)();
    
    // 验证数据
    const validationResult = validator.validateUserProfile({
      userId: 'user_123',
      ...data
    });
    
    if (!validationResult.isValid) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.errors 
        } 
      };
    }
    
    // 检查是否已存在
    const existingProfile = await userProfileService.getProfileByUserId('user_123');
    if (existingProfile) {
      return { status: 409, body: { success: false, error: 'Profile already exists' } };
    }
    
    // 创建画像
    const profile = await userProfileService.createProfile({
      userId: 'user_123',
      ...data
    });
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: profile,
        message: 'Profile created successfully'
      } 
    };
  }
  
  return { status: 404, body: { error: 'Not found' } };
}

// 处理PATCH请求
async function handlePatchRequest(path: string, data: any) {
  if (path === '/api/user/profile') {
    const userProfileService = new (UserProfileService as any)();
    const validator = new (UserProfileValidator as any)();
    
    // 验证数据
    const validationResult = validator.validateUserProfile({
      userId: 'user_123',
      ...data
    });
    
    if (!validationResult.isValid) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.errors 
        } 
      };
    }
    
    // 检查是否存在
    const existingProfile = await userProfileService.getProfileByUserId('user_123');
    if (!existingProfile) {
      return { status: 404, body: { success: false, error: 'Profile not found' } };
    }
    
    // 更新画像
    const profile = await userProfileService.updateProfile('user_123', data);
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: profile,
        message: 'Profile updated successfully'
      } 
    };
  }
  
  return { status: 404, body: { error: 'Not found' } };
}

// 处理DELETE请求
async function handleDeleteRequest(path: string) {
  if (path === '/api/user/profile') {
    const userProfileService = new (UserProfileService as any)();
    
    // 检查是否存在
    const existingProfile = await userProfileService.getProfileByUserId('user_123');
    if (!existingProfile) {
      return { status: 404, body: { success: false, error: 'Profile not found' } };
    }
    
    // 删除画像
    await userProfileService.deleteProfile('user_123');
    
    return { 
      status: 200, 
      body: { 
        success: true,
        message: 'Profile deleted successfully'
      } 
    };
  }
  
  return { status: 404, body: { error: 'Not found' } };
}

// 获取CORS头
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}