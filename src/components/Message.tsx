import React from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'

// 定义Message组件的props类型
type MessageProps = {
  role: 'user' | 'assistant' // 限定role为这两种值
  content: string // 允许任何React可渲染内容
}

const Message = ({ role, content }: MessageProps) => {
  const copyMessage = () => {
    navigator.clipboard.writeText(content as string)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-8 ${
          role === 'user' && 'items-end'
        }`}
      >
        <div
          className={`group relative flex max-w-2xl py-3 rounded-xl
          ${role === 'user' ? 'bg-[#414158] px-5' : 'gap-3'}`}
        >
          <div
            className={`opacity-0 group-hover:opacity-100 absolute ${
              role === 'user' ? '-left-16 top-2.5' : 'left-9 -bottom-6'
            } transition-all`}
          >
            <div className="flex items-center gap-2 opacity-70">
              {role === 'user' ? (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                  />
                  <Image
                    src={assets.pencil_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                  />
                </>
              ) : (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icon}
                    alt=""
                    className="w-4.5 cursor-pointer"
                  />
                  <Image
                    src={assets.regenerate_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                  />
                  <Image
                    src={assets.like_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                  />
                  <Image
                    src={assets.dislike_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>

          {role === 'user' ? (
            <span className="text-white/90">{content}</span>
          ) : (
            <>
              <Image
                src={assets.logo_icon}
                alt=""
                className="h-9 w-9 p-1 border-white/15 rounded-full"
              />
              <div className="space-y-4 w-full overflow-scroll">{content}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default Message
