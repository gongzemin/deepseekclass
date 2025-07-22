'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import Sidebar from '@/components/Sidebar'
import PromptBox from '@/components/PromptBox'
import Message from '@/components/Message'
import { useAppContext } from '@/context/AppContext'

import { MessageType } from '@/types'

export default function Home() {
  const [expand, setExpand] = useState(false)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { selectedChat } = useAppContext() // 从全局状态中获取selectedChat

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages)
    }
  }, [selectedChat])

  // 切换对话的时候 可以到每段对话的结束
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  })

  return (
    <div className="flex h-screen">
      <Sidebar expand={expand} setExpand={setExpand} />
      <div
        className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d]
       text-white relative"
      >
        <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
          <Image
            onClick={() => (expand ? setExpand(false) : setExpand(true))}
            className="rotate-180"
            src={assets.menu_icon}
            alt=""
          />
          <Image className="opacity-70" src={assets.chat_icon} alt="" />
        </div>

        {messages.length === 0 ? (
          <>
            <div className="flex items-center gap-3">
              <Image
                className="w-16 h-14"
                src={assets.logo_icon}
                alt="DeepSeek Logo"
              />
              <p className="text-2xl font-medium">
                我是 DeepSeek，很高兴见到你！
              </p>
            </div>
            <p className="text-sm mt-2">
              我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧~
            </p>
          </>
        ) : (
          <div
            ref={containerRef}
            className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen
            overflow-y-auto"
          >
            <p
              className="fixed top-8 border border-transparent hover:border-gray-500/50 py-1
              px-2 rounded-lg font-semibold mb-6"
            >
              {selectedChat?.name}
            </p>
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} content={msg.content} />
            ))}
            {isLoading && (
              <div className="flex gap-4 max-w-3xl w-full py-3">
                <Image
                  className="h-9 w-9 p-1 border border-white/15 rounded-full"
                  src={assets.logo_icon}
                  alt="Logo"
                />
                <div className="loader flex justify-center items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        )}

        <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
        <p className="text-xs absolute bottom-1 text-gray-500">
          内容由 AI 生成，请仔细甄别
        </p>
      </div>
    </div>
  )
}
