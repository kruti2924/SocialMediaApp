import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Send, 
  Plus, 
  Search, 
  Users, 
  MessageCircle,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react'
import { messagesAPI, usersAPI } from '../utils/api'
import { formatMessageDate, generateAvatarUrl, cn } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: conversationsData,
    isLoading: conversationsLoading
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesAPI.getConversations,
  })

  const conversations = conversationsData?.data?.conversations || []

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true
    const otherParticipants = conversation.participants.filter(p => p._id !== user.id)
    return otherParticipants.some(p => 
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-full border rounded-lg overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 border-r bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button className="btn btn-outline btn-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    isSelected={selectedConversation?._id === conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  Select a conversation to start messaging
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const { user } = useAuth()
  const otherParticipants = conversation.participants.filter(p => p._id !== user.id)
  const displayName = conversation.isGroup 
    ? conversation.groupName || `${conversation.participants.length} members`
    : otherParticipants[0]?.username || 'Unknown'

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {conversation.isGroup ? (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <img
              className="h-10 w-10 rounded-full"
              src={otherParticipants[0]?.profilePicture || generateAvatarUrl(otherParticipants[0]?.username)}
              alt={otherParticipants[0]?.username}
            />
          )}
          {!conversation.isGroup && otherParticipants[0]?.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium truncate">{displayName}</p>
            {conversation.lastMessage && (
              <p className="text-xs text-muted-foreground">
                {formatMessageDate(conversation.lastMessage.createdAt)}
              </p>
            )}
          </div>
          {conversation.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

const ChatWindow = ({ conversation }) => {
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const { joinRoom, sendMessage, onReceiveMessage } = useSocket()
  const queryClient = useQueryClient()

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch
  } = useQuery({
    queryKey: ['messages', conversation._id, page],
    queryFn: () => messagesAPI.getMessages(conversation._id, page, 50),
    enabled: !!conversation._id
  })

  const sendMessageMutation = useMutation({
    mutationFn: messagesAPI.sendMessage,
    onSuccess: () => {
      setMessageText('')
      queryClient.invalidateQueries(['conversations'])
    },
    onError: () => {
      toast.error('Failed to send message')
    },
  })

  useEffect(() => {
    if (conversation._id) {
      joinRoom(conversation._id)
    }
  }, [conversation._id, joinRoom])

  useEffect(() => {
    if (messagesData?.data?.messages) {
      const newMessages = messagesData.data.messages
      if (page === 1) {
        setMessages(newMessages)
      } else {
        setMessages(prev => [...newMessages, ...prev])
      }
      setHasMore(messagesData.data.pagination.hasNext)
    }
  }, [messagesData, page])

  useEffect(() => {
    const cleanup = onReceiveMessage((data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => [...prev, data])
        queryClient.invalidateQueries(['conversations'])
      }
    })
    return cleanup
  }, [conversation._id, onReceiveMessage, queryClient])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    const messageData = {
      conversationId: conversation._id,
      content: messageText.trim(),
      messageType: 'text'
    }

    sendMessageMutation.mutate(messageData)
    sendMessage(messageData)
  }

  const loadMoreMessages = () => {
    if (hasMore && !messagesLoading) {
      setPage(prev => prev + 1)
    }
  }

  const otherParticipants = conversation.participants.filter(p => p._id !== user.id)

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {conversation.isGroup ? (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            ) : (
              <img
                className="h-8 w-8 rounded-full"
                src={otherParticipants[0]?.profilePicture || generateAvatarUrl(otherParticipants[0]?.username)}
                alt={otherParticipants[0]?.username}
              />
            )}
            <div>
              <h3 className="font-medium">
                {conversation.isGroup 
                  ? conversation.groupName || `${conversation.participants.length} members`
                  : otherParticipants[0]?.username
                }
              </h3>
              {!conversation.isGroup && (
                <p className="text-sm text-muted-foreground">
                  {otherParticipants[0]?.isOnline ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-accent rounded-full">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-accent rounded-full">
              <Video className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-accent rounded-full">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={messagesLoading}
              className="btn btn-outline btn-sm"
            >
              {messagesLoading ? <LoadingSpinner size="sm" /> : 'Load More'}
            </button>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isLoading}
            className="btn btn-primary"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

const MessageBubble = ({ message }) => {
  const { user } = useAuth()
  const isOwnMessage = message.sender._id === user.id

  return (
    <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isOwnMessage 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1">{message.sender.username}</p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatMessageDate(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export default Messages
