import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  FormEvent,
} from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import toast from 'react-hot-toast'
import { useAppContext } from '@/context/AppContext'
import { MessageType } from '@/types'

// 定义组件 props 类型
interface PromptBoxProps {
  setIsLoading: (isLoading: boolean) => void
  isLoading: boolean
}
const PromptBox: React.FC<PromptBoxProps> = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState<string>('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { user, setChats, selectedChat, setSelectedChat } = useAppContext() // 全局状态

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果按下的是回车键且没有按住 Shift 键，则发送消息
    // Shift + Enter 用于换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendPrompt(e)
    }
  }

  const sendPrompt = async (
    e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>
  ) => {
    const promptCopy = prompt // 缓存当前输入的prompt，用于后续错误恢复
    try {
      // 前置校验：阻止默认事件、检查登录状态、检查是否正在加载、检查输入是否为空
      e.preventDefault() // 阻止事件默认行为
      if (!user) return toast.error('登录开启对话')
      if (isLoading) return toast.error('等待响应')

      if (!prompt.trim()) {
        toast.error('请输入消息')
        return
      }

      setIsLoading(true) // 设置加载状态为 true
      setPrompt('') // 清空输入框内容

      const userPrompt: MessageType = {
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      }

      // 更新全局聊天列表
      setChats(prevChats =>
        prevChats.map(chat =>
          chat._id === selectedChat?._id
            ? {
                ...chat,
                messages: [...chat.messages, userPrompt],
              }
            : chat
        )
      )

      // 更新当前选中的聊天记录
      setSelectedChat(prevChat => {
        if (!prevChat) return null
        return {
          ...prevChat,
          messages: [...prevChat.messages, userPrompt],
        }
      })

      // 使用fetch处理SSE请求
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat?._id,
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('网络请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let fullContent = ''
      let isFirstContent = true // 标记是否是第一次收到内容
      const assistantMessage: MessageType = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      // 添加空的助手消息
      setSelectedChat(prevChat => {
        if (!prevChat) return null
        return {
          ...prevChat,
          messages: [...prevChat.messages, assistantMessage],
        }
      })

      // 处理SSE流
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text
          .split('\n\n')
          .filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const jsonData = JSON.parse(line.replace('data: ', ''))

          if (jsonData.success === false) {
            toast.error(jsonData.error)
            setPrompt(promptCopy)
            setIsLoading(false) // 错误时停止加载
            return
          }

          if (jsonData.content) {
            if (isFirstContent) {
              setIsLoading(false) // 第一次收到内容时停止加载
              isFirstContent = false
            }
            fullContent += jsonData.content
            // 实时更新助手消息内容
            setSelectedChat(prev => {
              if (!prev) return null
              const updatedMessages = [
                ...prev.messages.slice(0, -1),
                { ...assistantMessage, content: fullContent },
              ]
              return {
                ...prev,
                messages: updatedMessages,
              }
            })
          }

          // 处理最终消息
          if (jsonData.success && jsonData.data) {
            // 更新全局聊天列表
            setChats(prevChats =>
              prevChats.map(chat => {
                if (chat._id === selectedChat?._id) {
                  const updatedMessages = [...chat.messages, jsonData.data]
                  const firstAssistantMessage =
                    updatedMessages.find(item => item.role === 'assistant')
                      ?.content || ''

                  const shouldUpdateName =
                    chat.name === '新聊天' ||
                    chat.name === '未命名聊天' ||
                    !chat.name

                  const newName = shouldUpdateName
                    ? firstAssistantMessage.substring(0, 12)
                    : chat.name

                  if (shouldUpdateName) {
                    fetch('/api/chat/rename', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        chatId: chat._id,
                        name: newName,
                      }),
                    }).catch(err => {
                      console.error('自动命名入库失败', err)
                    })
                  }

                  return {
                    ...chat,
                    name: newName,
                    messages: updatedMessages,
                  }
                }
                return chat
              })
            )
          }
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '发送消息失败，请重试'
      )
      setPrompt(promptCopy) // 恢复输入内容
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full ${
        selectedChat?.messages.length ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        className="outline-none w-full resize-none overflow-y-auto break-words bg-transparent max-h-[336px] text-white"
        rows={2}
        placeholder="给 DeepSeek 发送消息"
        required
        onChange={e => setPrompt(e.target.value)}
        value={prompt}
      />

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <p
            className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer
             hover:bg-gray-500/20 transition"
          >
            <Image className="h-5" src={assets.deepthink_icon} alt="" />
            深度思考 (R1)
          </p>
          <p
            className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer
             hover:bg-gray-500/20 transition"
          >
            <Image className="h-5" src={assets.search_icon} alt="" />
            联网搜索
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="" />
          <button
            className={`${prompt ? 'bg-primary' : 'bg-[#71717a]'}
           rounded-full p-2 cursor-pointer`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
              alt=""
            />
          </button>
        </div>
      </div>
    </form>
  )
}
export default PromptBox
