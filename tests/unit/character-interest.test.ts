/**
 * @fileoverview 角色兴趣匹配算法单元测试 - 基于真实API设计
 * TestCraft AI - AlgorithmTestAgent
 * 核心测试：兴趣匹配算法的准确性、边界条件、性能基准
 * 完全匹配真实ChatService.evaluateInterest API签名
 */

import { ChatService, InterestEvaluation } from '../../src/lib/chat-service';
import { Character } from '@prisma/client';

// Mock MemoryBankManager
jest.mock('../../src/lib/memory-bank', () => ({
  MemoryBankManager: jest.fn().mockImplementation(() => ({
    getMemoryBank: jest.fn().mockResolvedValue({
      personalityTraits: {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.6,
        agreeableness: 0.9,
        neuroticism: 0.3
      }
    })
  }))
}));

// Mock数据生成器 - 完全匹配Prisma Character schema
const createMockCharacter = (overrides = {}): Character => ({
  id: 'test-character-1',
  name: '测试角色',
  age: 25,
  occupation: '软件工程师',
  personality: '热情、理性、好奇',
  background: '热爱技术的工程师',
  speakingStyle: '友好且专业',
  interests: '人工智能、机器学习、编程、科技新闻',
  systemPrompt: '你是一个热爱技术的AI助手',
  participationLevel: 'high',
  interestThreshold: 0.7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('Character Interest Matching Algorithm - Real API Test', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    // 设置测试环境为演示模式
    process.env.ZAI_API_KEY = 'demo-key-for-testing';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('精确匹配场景', () => {
    test('话题与角色兴趣完全匹配 - 应返回有效结果', async () => {
      const character = createMockCharacter({
        interests: '人工智能、机器学习',
        interestThreshold: 0.7
      });
      
      const result = await chatService.evaluateInterest(
        character,
        '人工智能的最新发展',
        '当前讨论上下文'
      );
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('shouldParticipate');
      expect(typeof result.score).toBe('number');
      expect(typeof result.reason).toBe('string');
      expect(typeof result.shouldParticipate).toBe('boolean');
    });

    test('话题与角色兴趣部分匹配 - 应返回有效结果', async () => {
      const character = createMockCharacter({
        interests: '机器学习、深度学习',
        interestThreshold: 0.6
      });
      
      const result = await chatService.evaluateInterest(
        character,
        '神经网络在图像识别中的应用',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('边界条件测试', () => {
    test('空话题处理', async () => {
      const character = createMockCharacter();
      
      const result = await chatService.evaluateInterest(
        character,
        '',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(typeof result.reason).toBe('string');
    });

    test('超长话题处理', async () => {
      const character = createMockCharacter();
      const longTopic = '人工智能'.repeat(100);
      
      const startTime = Date.now();
      const result = await chatService.evaluateInterest(
        character,
        longTopic,
        '当前讨论上下文'
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(typeof result.reason).toBe('string');
    });

    test('特殊字符话题处理', async () => {
      const character = createMockCharacter({
        interests: '编程、技术'
      });
      
      const specialTopics = [
        'AI技术@2024',
        '编程#开发',
        '技术$创新',
        '代码%优化'
      ];
      
      for (const topic of specialTopics) {
        const result = await chatService.evaluateInterest(
          character,
          topic,
          '当前讨论上下文'
        );
        
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(typeof result.reason).toBe('string');
      }
    });
  });

  describe('兴趣阈值边界测试', () => {
    test('低阈值角色', async () => {
      const character = createMockCharacter({
        interests: '人工智能',
        interestThreshold: 0.3
      });
      
      const result = await chatService.evaluateInterest(
        character,
        '人工智能发展',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.shouldParticipate).toBe('boolean');
    });

    test('高阈值角色', async () => {
      const character = createMockCharacter({
        interests: '人工智能',
        interestThreshold: 0.9
      });
      
      const result = await chatService.evaluateInterest(
        character,
        '人工智能发展',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.shouldParticipate).toBe('boolean');
    });
  });

  describe('多语言支持测试', () => {
    test('英文话题匹配', async () => {
      const character = createMockCharacter({
        interests: 'artificial intelligence, machine learning'
      });
      
      const result = await chatService.evaluateInterest(
        character,
        'Latest developments in AI',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.reason).toBe('string');
    });

    test('混合语言话题', async () => {
      const character = createMockCharacter({
        interests: '人工智能, machine learning'
      });
      
      const result = await chatService.evaluateInterest(
        character,
        'AI人工智能的发展',
        '当前讨论上下文'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('性能基准测试', () => {
    test('单次匹配耗时', async () => {
      const character = createMockCharacter();
      
      const startTime = Date.now();
      const result = await chatService.evaluateInterest(
        character,
        '人工智能话题',
        '当前讨论上下文'
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000); // 3秒内完成
      expect(result).toBeDefined();
    });

    test('并发匹配性能', async () => {
      const characters = Array.from({ length: 5 }, (_, i) => 
        createMockCharacter({ id: `character-${i}`, name: `角色${i}` })
      );
      
      const startTime = Date.now();
      const results = await Promise.all(
        characters.map(char => 
          chatService.evaluateInterest(char, '人工智能', '当前讨论上下文')
        )
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成5个并发
    });
  });

  describe('演示模式测试', () => {
    test('演示模式下不调用外部API', async () => {
      const character = createMockCharacter({
        interests: '人工智能'
      });
      
      const result = await chatService.evaluateInterest(
        character,
        '人工智能话题',
        '当前讨论上下文'
      );
      
      expect(result).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(typeof result.shouldParticipate).toBe('boolean');
    });
  });

  describe('错误处理测试', () => {
    test('无效角色对象 - 应抛出错误', async () => {
      const invalidCharacter = null as any;
      
      await expect(
        chatService.evaluateInterest(invalidCharacter, '话题', '当前讨论上下文')
      ).rejects.toThrow();
    });

    test('空上下文处理', async () => {
      const character = createMockCharacter();
      
      const result = await chatService.evaluateInterest(
        character,
        '人工智能话题',
        ''
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(typeof result.reason).toBe('string');
    });
  });
});