'use client'

import { useEffect, useRef, useState } from 'react'

interface UseSocketProps {
  url?: string
  onMessage?: (data: any) => void
  onNewMessage?: (data: any) => void
  onJoinedRoom?: (data: any) => void
  onError?: (data: any) => void
}

export const useSocket = ({
  url = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  onMessage,
  onNewMessage,
  onJoinedRoom,
  onError
}: UseSocketProps = {}) => {
  const socketRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 动态导入socket.io-client
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        
        socketRef.current = io(url, {
          transports: ['websocket', 'polling']
        })

        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket server')
          setIsConnected(true)
        })

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from WebSocket server')
          setIsConnected(false)
        })

        // 监听消息
        socketRef.current.on('message', (data: any) => {
          console.log('Received message:', data)
          onMessage?.(data)
        })

        // 监听新消息
        socketRef.current.on('new-message', (data: any) => {
          console.log('Received new message:', data)
          onNewMessage?.(data)
        })

        // 监听加入房间
        socketRef.current.on('joined-room', (data: any) => {
          console.log('Joined room:', data)
          onJoinedRoom?.(data)
        })

        // 监听错误
        socketRef.current.on('error', (data: any) => {
          console.error('Socket error:', data)
          onError?.(data)
        })

      } catch (error) {
        console.error('Failed to initialize socket:', error)
      }
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [url, onMessage, onNewMessage, onJoinedRoom, onError])

  const joinRoom = (chatRoomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-room', chatRoomId)
    }
  }

  const sendMessage = (messageData: {
    content: string
    senderType: 'user' | 'character' | 'system'
    senderId?: string
    chatRoomId: string
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('chat-message', messageData)
    }
  }

  const requestAIResponse = (data: {
    message: string
    chatRoomId: string
    characterId: string
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request-ai-response', data)
    }
  }

  return {
    isConnected,
    joinRoom,
    sendMessage,
    requestAIResponse
  }
}