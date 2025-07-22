import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  FormEvent,
} from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
// 定义组件 props 类型
interface PromptBoxProps {
  setIsLoading: (isLoading: boolean) => void
  isLoading: boolean
}
const PromptBox: React.FC<PromptBoxProps> = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState<string>('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  return (
    <form
      className={`w-full ${
        true ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
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
