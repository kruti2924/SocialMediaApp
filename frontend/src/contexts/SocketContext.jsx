import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          userId: user.id
        }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  const joinRoom = (conversationId) => {
    if (socket) {
      socket.emit('join-room', conversationId)
    }
  }

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send-message', messageData)
    }
  }

  const onReceiveMessage = (callback) => {
    if (socket) {
      socket.on('receive-message', callback)
      return () => socket.off('receive-message', callback)
    }
  }

  const value = {
    socket,
    isConnected,
    joinRoom,
    sendMessage,
    onReceiveMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
