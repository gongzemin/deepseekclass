'use client'
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import axios from 'axios'
import toast from 'react-hot-toast'

type UserType = ReturnType<typeof useUser>['user']

import { MessageType } from '@/types'

// 聊天记录类型
interface ChatType {
  _id: string // 对应 MongoDB 的 ObjectId（字符串类型）
  updatedAt: string // ISO 日期字符串（推荐）或 Date 类型
  messages: MessageType[]
  name?: string
}

interface AppContextType {
  user: UserType
  chats: ChatType[]
  setChats: React.Dispatch<React.SetStateAction<ChatType[]>>
  selectedChat: ChatType | null
  setSelectedChat: React.Dispatch<React.SetStateAction<ChatType | null>>
  fetchUsersChats: () => Promise<void>
  createNewChat: () => Promise<void>
}

export const AppContext = createContext<AppContextType>({
  user: null,
  chats: [],
  setChats: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  fetchUsersChats: async () => {},
  createNewChat: async () => {},
})

export const useAppContext = () => useContext(AppContext)

interface AppContextProviderProps {
  children: ReactNode
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
  const { user } = useUser()
  const { getToken } = useAuth()

  const [chats, setChats] = useState<ChatType[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null)

  // 🔗 创建新聊天
  const createNewChat = useCallback(async () => {
    try {
      if (!user) return
      const token = await getToken()
      await axios.post(
        '/api/chat/create',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast.success('新聊天创建成功')
      // 不需要直接调用 fetchUsersChats，这会在调用者自己处理
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建新聊天失败'
      toast.error(message)
    }
  }, [user, getToken])

  // 🔗 获取用户聊天列表
  const fetchUsersChats = useCallback(async () => {
    try {
      if (!user) return
      const token = await getToken()
      const { data } = await axios.get('/api/chat/get', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.success) {
        const chatList: ChatType[] = data.data

        if (chatList.length === 0) {
          // 没有聊天，自动创建
          await createNewChat()
          // 创建后重新拉取
          const retryData = await axios.get('/api/chat/get', {
            headers: { Authorization: `Bearer ${token}` },
          })
          const retryChatList: ChatType[] = retryData.data.data || []
          setChats(retryChatList)

          if (retryChatList.length > 0) {
            const sortedChats = [...retryChatList].sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            setSelectedChat(sortedChats[0])
          }

          return
        }

        const sortedChats = [...chatList].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        setChats(sortedChats)
        setSelectedChat(sortedChats[0])
      } else {
        toast.error(data.message || '获取聊天列表失败')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '获取聊天列表失败'
      toast.error(message)
    }
  }, [user, getToken, createNewChat])

  // 👀 自动拉取聊天列表
  useEffect(() => {
    if (user) {
      fetchUsersChats()
    }
  }, [user, fetchUsersChats])

  const value: AppContextType = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
