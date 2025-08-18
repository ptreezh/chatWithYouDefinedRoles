/**
 * @fileoverview 角色兴趣匹配算法增强测试 - TestCraft AI
 * TestCraft AI - AlgorithmTestAgent
 * 世界级测试标准：属性化测试、边界条件、性能基准、故障恢复
 */

import { jest } from '@jest/globals';
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
      },
      conversationHistory: [],
      preferences: {
        topics: ['technology', 'science', 'innovation'],
        communicationStyle: 'friendly'
      }
    })
  }))
}));

// Mock fetch for API testing
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// 属性化测试数据生成器
const generatePropertyBasedTestData = () => {
  const topics = [
    '人工智能', '机器学习', '深度学习', '神经网络', '自然语言处理',
    '计算机视觉', '强化学习', '数据科学', '云计算', '区块链',
    '物联网', '量子计算', '生物技术', '太空探索', '可再生能源'
  ];
  
  const interests = [
    '技术', '科学', '创新', '编程', '算法', '研究', '开发',
    '工程', '数学', '物理', '化学', '生物', '医学', '经济',
    '心理学', '哲学', '艺术', '音乐', '文学', '历史'
  ];

  return {
    randomTopic: () => topics[Math.floor(Math.random() * topics.length)],
    randomInterest: () => interests[Math.floor(Math.random() * interests.length)],
    randomThreshold: () => Math.random() * 0.8 + 0.1, // 0.1-0.9
    randomCharacter: (overrides = {}) => createMockCharacter(overrides)
  };
};

// 测试角色生成器
const createMockCharacter = (overrides = {}): Character => ({
  id: `test-character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: '测试角色',
  age: 25,
  occupation: '软件工程师',
  personality: '热情、理性、好奇',
  background: '热爱技术的工程师，专注于AI和机器学习领域',
  speakingStyle: '友好且专业，善于解释复杂概念',
  interests: '人工智能、机器学习、编程、科技新闻、开源项目',
  systemPrompt: '你是一个热爱技术的AI助手，善于用通俗易懂的方式解释技术概念',
  participationLevel: 'high',
  interestThreshold: 0.7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('Character Interest Matching - Enhanced Algorithm Tests', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('🎯 精确匹配算法测试', () => {
    test('完全匹配场景 - 应返回最高分数', async () => {
      const character = createMockCharacter({
        interests: '人工智能、机器学习、深度学习',
        interestThreshold: 0.5
      });

      const result = await chatService.evaluateInterest(
        character,
        '人工智能和机器学习的最新发展',
        '讨论AI技术的前沿进展'
      );

      expect(result.score).toBeGreaterThan(0.8);
      expect(result.shouldParticipate).toBe(true);
      expect(result.reason).toContain('人工智能');
    });

    test('部分匹配场景 - 应返回中等分数', async () => {
      const character = createMockCharacter({
        interests: '机器学习、深度学习',
        interestThreshold: 0.7
      });

      const result = await chatService.evaluateInterest(
        character,
        '神经网络在图像识别中的应用',
        '讨论计算机视觉技术'
      );

      expect(result.score).toBeGreaterThan(0.5);
      expect(result.score).toBeLessThan(0.9);
      expect(typeof result.reason).toBe('string');
    });

    test('无匹配场景 - 应返回低分数', async () => {
      const character = createMockCharacter({
        interests: '文学、艺术、音乐',
        interestThreshold: 0.6
      });

      const result = await chatService.evaluateInterest(
        character,
        '量子计算的最新突破',
        '讨论量子技术'
      );

      expect(result.score).toBeLessThan(0.4);
      expect(result.shouldParticipate).toBe(false);
    });
  });

  describe('⚡ 性能基准测试', () => {
    test('算法响应时间应小于100ms', async () => {
      const character = createMockCharacter();
      const topic = '人工智能发展趋势';
      const context = '技术讨论场景';

      const startTime = Date.now();
      const result = await chatService.evaluateInterest(character, topic, context);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('shouldParticipate');
    });

    test('批量匹配性能测试 - 100个角色同时匹配', async () => {
      const characters = Array.from({ length: 100 }, (_, i) =>
        createMockCharacter({
          name: `测试角色${i}`,
          interests: `人工智能、技术${i}`
        })
      );

      const topic = '机器学习应用';
      const context = '技术分享会';

      const startTime = Date.now();
      const results = await Promise.all(
        characters.map(char => chatService.evaluateInterest(char, topic, context))
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / characters.length;

      expect(totalTime).toBeLessThan(5000); // 5秒内完成100个匹配
      expect(avgTime).toBeLessThan(50); // 平均每个<50ms
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('🔄 AI服务降级机制测试', () => {
    test('ZAI API故障时启用演示模式', async () => {
      const character = createMockCharacter();
      const topic = '人工智能';
      const context = '技术讨论';

      // 模拟API故障
      mockFetch.mockRejectedValue(new Error('API Connection Failed'));

      // 确保演示模式启用
      process.env.ZAI_API_KEY = 'demo-key';

      const result = await chatService.evaluateInterest(character, topic, context);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reason).toBeTruthy();
      expect(mockFetch).toHaveBeenCalled();
    });

    test('网络超时处理 - 应优雅降级', async () => {
      const character = createMockCharacter();

      // 模拟网络超时
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network Timeout')), 5000)
        )
      );

      const result = await chatService.evaluateInterest(
        character,
        '机器学习',
        '技术讨论'
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reason).toContain('演示');
    });

    test('API限流响应处理', async () => {
      const character = createMockCharacter();

      // 模拟429限流响应
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      });

      const result = await chatService.evaluateInterest(
        character,
        '深度学习',
        'AI讨论'
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reason).toBeTruthy();
    });
  });

  describe('🧪 边界条件测试', () => {
    test('空话题处理', async () => {
      const character = createMockCharacter();
      const result = await chatService.evaluateInterest(character, '', '上下文');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reason).toBeTruthy();
      expect(typeof result.shouldParticipate).toBe('boolean');
    });

    test('超长话题处理 - 1000字符限制', async () => {
      const character = createMockCharacter();
      const longTopic = '人工智能'.repeat(200); // 1000字符

      const result = await chatService.evaluateInterest(character, longTopic, '上下文');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reason.length).toBeLessThan(500);
    });

    test('特殊字符和表情符号处理', async () => {
      const character = createMockCharacter({ interests: '编程、技术' });
      const specialTopics = [
        '🤖 AI技术@2024',
        '编程#开发💻',
        '技术\u{1F680}创新',
        '代码%优化🔧',
        '测试<>验证&集成'
      ];

      for (const topic of specialTopics) {
        const result = await chatService.evaluateInterest(character, topic, '测试');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.reason).toBeTruthy();
      }
    });

    test('Unicode和国际化字符处理', async () => {
      const character = createMockCharacter();
      const unicodeTopics = [
        'こんにちはAI技術', // 日文
        'Привет искусственный интеллект', // 俄文
        'مرحبا بالذكاء الاصطناعي', // 阿拉伯文
        '🤖🧠💡人工智能', // 表情符号混合
      ];

      for (const topic of unicodeTopics) {
        const result = await chatService.evaluateInterest(character, topic, '国际化测试');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.reason).toBeTruthy();
      }
    });
  });

  describe('🎯 兴趣阈值边界测试', () => {
    const testThresholds = [0.1, 0.3, 0.5, 0.7, 0.9];

    test.each(testThresholds)(
      '阈值测试：阈值=%f时的行为验证',
      async (threshold) => {
        const character = createMockCharacter({
          interests: '人工智能',
          interestThreshold: threshold
        });

        const result = await chatService.evaluateInterest(
          character,
          '人工智能发展',
          '技术讨论'
        );

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
        expect(typeof result.shouldParticipate).toBe('boolean');

        // 验证阈值逻辑
        if (result.score >= threshold) {
          expect(result.shouldParticipate).toBe(true);
        }
      }
    );
  });

  describe('🌍 多语言支持测试', () => {
    test('中英文混合匹配', async () => {
      const character = createMockCharacter({
        interests: 'artificial intelligence 人工智能 machine learning 机器学习'
      });

      const testCases = [
        { topic: '深度学习在AI中的应用', expectedHighScore: true },
        { topic: 'Deep learning applications in AI', expectedHighScore: true },
        { topic: '机器学习算法比较', expectedHighScore: true },
        { topic: 'Comparison of machine learning algorithms', expectedHighScore: true }
      ];

      for (const { topic, expectedHighScore } of testCases) {
        const result = await chatService.evaluateInterest(character, topic, '多语言测试');
        expect(result.score).toBeGreaterThanOrEqual(0);
        if (expectedHighScore) {
          expect(result.score).toBeGreaterThan(0.6);
        }
      }
    });

    test('跨语言语义匹配', async () => {
      const character = createMockCharacter({
        interests: 'neural networks 神经网络 deep learning 深度学习'
      });

      const result = await chatService.evaluateInterest(
        character,
        '神经网络技术',
        '跨语言语义测试'
      );

      expect(result.score).toBeGreaterThan(0.7);
      expect(result.reason).toMatch(/神经网络|neural|deep.*learning/i);
    });
  });

  describe('📊 属性化测试 (Property-Based Testing)', () => {
    const { randomTopic, randomInterest, randomThreshold, randomCharacter } = generatePropertyBasedTestData();

    test('分数范围属性：所有分数应在0-1之间', async () => {
      for (let i = 0; i < 50; i++) {
        const character = randomCharacter({ interestThreshold: randomThreshold() });
        const topic = randomTopic();
        const result = await chatService.evaluateInterest(character, topic, '属性测试');

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
        expect(typeof result.shouldParticipate).toBe('boolean');
      }
    });

    test('一致性属性：相同输入应产生相同输出', async () => {
      const character = randomCharacter();
      const topic = randomTopic();
      const context = '一致性测试';

      const result1 = await chatService.evaluateInterest(character, topic, context);
      const result2 = await chatService.evaluateInterest(character, topic, context);

      expect(result1.score).toBeCloseTo(result2.score, 2);
      expect(result1.shouldParticipate).toBe(result2.shouldParticipate);
    });
  });

  describe('🎯 业务逻辑验证', () => {
    test('高兴趣角色应优先参与相关话题', async () => {
      const characters = [
        createMockCharacter({ interests: '人工智能', interestThreshold: 0.3, name: 'AI专家' }),
        createMockCharacter({ interests: '文学', interestThreshold: 0.8, name: '文学爱好者' }),
        createMockCharacter({ interests: '人工智能', interestThreshold: 0.9, name: 'AI研究员' })
      ];

      const topic = '人工智能的未来发展';
      const results = await Promise.all(
        characters.map(char => chatService.evaluateInterest(char, topic, '业务场景测试'))
      );

      // AI专家应该参与(阈值低+匹配)
      expect(results[0].shouldParticipate).toBe(true);
      // 文学爱好者不应该参与(不匹配)
      expect(results[1].shouldParticipate).toBe(false);
      // AI研究员应该参与(匹配度高)
      expect(results[2].shouldParticipate).toBe(true);
    });
  });
});