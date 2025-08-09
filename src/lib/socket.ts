import { Server } from 'socket.io';
import { db } from './db';

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'character' | 'system';
  senderId?: string;
  character?: any;
  chatRoomId: string;
  createdAt: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // 加入聊天室
    socket.on('join-room', (chatRoomId: string) => {
      socket.join(chatRoomId);
      console.log(`Client ${socket.id} joined room ${chatRoomId}`);
      
      // 发送加入成功消息
      socket.emit('joined-room', { chatRoomId, message: '成功加入聊天室' });
    });

    // 处理聊天消息
    socket.on('chat-message', async (messageData: {
      content: string;
      senderType: 'user' | 'character' | 'system';
      senderId?: string;
      chatRoomId: string;
    }) => {
      try {
        // 保存消息到数据库
        const message = await db.message.create({
          data: {
            content: messageData.content,
            senderType: messageData.senderType,
            senderId: messageData.senderId || null,
            chatRoomId: messageData.chatRoomId
          },
          include: {
            character: true,
            user: true
          }
        });

        // 广播消息给聊天室内的所有客户端
        io.to(messageData.chatRoomId).emit('new-message', {
          id: message.id,
          content: message.content,
          senderType: message.senderType,
          senderId: message.senderId,
          character: message.character,
          chatRoomId: message.chatRoomId,
          createdAt: message.createdAt
        });

        console.log(`Message broadcasted to room ${messageData.chatRoomId}`);
      } catch (error) {
        console.error('Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 处理AI角色回复请求
    socket.on('request-ai-response', async (data: {
      message: string;
      chatRoomId: string;
      characterId: string;
    }) => {
      try {
        // 获取角色信息
        const character = await db.character.findUnique({
          where: { id: data.characterId }
        });

        if (!character) {
          socket.emit('error', { message: 'Character not found' });
          return;
        }

        // 获取聊天室的历史消息
        const recentMessages = await db.message.findMany({
          where: { chatRoomId: data.chatRoomId },
          include: {
            character: true,
            user: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        // 这里应该调用AI服务生成回复
        // 为了演示，我们生成一个简单的回复
        const aiResponse = `${character.name}: 我理解你说的是"${data.message}"。让我思考一下...`;

        // 保存AI回复到数据库
        const aiMessage = await db.message.create({
          data: {
            content: aiResponse,
            senderType: 'character',
            senderId: character.id,
            chatRoomId: data.chatRoomId
          },
          include: {
            character: true,
            user: true
          }
        });

        // 广播AI回复
        io.to(data.chatRoomId).emit('new-message', {
          id: aiMessage.id,
          content: aiMessage.content,
          senderType: aiMessage.senderType,
          senderId: aiMessage.senderId,
          character: aiMessage.character,
          chatRoomId: aiMessage.chatRoomId,
          createdAt: aiMessage.createdAt
        });

      } catch (error) {
        console.error('Error generating AI response:', error);
        socket.emit('error', { message: 'Failed to generate AI response' });
      }
    });

    // 处理断开连接
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // 发送欢迎消息
    socket.emit('message', {
      text: '欢迎来到虚拟角色聊天室！',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};