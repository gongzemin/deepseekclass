import React, { Dispatch, SetStateAction } from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import { OpenMenuState } from '@/types'
import { toast } from 'react-hot-toast'

// 使用接口定义props

// 允许 id 为 string 或 null（null 表示无菜单打开）

// 定义组件 Props 类型
interface ChatLabelProps {
  openMenu: OpenMenuState
  setOpenMenu?: Dispatch<SetStateAction<OpenMenuState>> // 接收完整状态对象
  id: string // 聊天ID
  name: string // 聊天名称
  isSelected?: boolean // 是否为当前选中的聊天
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  openMenu,
  setOpenMenu,
  id, // 聊天ID（从父组件传入）
  name, // 聊天名称（从父组件传入）
  isSelected = false, // 是否为当前选中的聊天（默认为false）
}) => {
  // 从全局状态获取方法和数据
  const { fetchUsersChats, chats, setSelectedChat } = useAppContext()
  const selectChat = () => {
    const chatData = chats.find(chat => chat._id == id) || null
    if (!chatData) return
    setSelectedChat(chatData)
  }

  const renameHandler = async () => {
    try {
      const newName = prompt('请输入新的聊天名称')
      if (!newName) return
      const { data } = await axios.post('/api/chat/rename', {
        chatId: id,
        name: newName,
      })
      if (data.success) {
        fetchUsersChats()
        setOpenMenu?.({ id: null, open: false })
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '重命名失败'
      toast.error(message)
    }
  }

  const deleteHandler = async () => {
    try {
      const confirm = window.confirm('确定要删除此聊天吗？')
      if (!confirm) return
      const { data } = await axios.post('/api/chat/delete', {
        chatId: id,
      })
      if (data.success) {
        fetchUsersChats()
        setOpenMenu?.({ id: null, open: false })
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除消息失败'
      toast.error(message)
    }
  }

  const wrapperClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发 selectChat
    setOpenMenu?.({ id, open: !openMenu.open }) // 切换菜单状态
  }

  return (
    <div
      onClick={selectChat}
      className={`flex items-center justify-between p-2 text-white/80
        hover:bg-white/10 
        ${isSelected ? 'bg-white/10' : ''} // 选中时应用与 hover 相同的背景
        rounded-lg text-sm group cursor-pointer`}
    >
      <p className="group-hover:max-w-5/6 truncate">{name}</p>
      <div
        onClick={e => wrapperClick(e, id)}
        className="group relative flex items-center justify-center h-6 w-6 aspect-square
      hover:bg-black/80 rounded-lg"
      >
        <Image
          src={assets.three_dots}
          alt=""
          className={`w-4 ${
            openMenu.id === id && openMenu.open ? '' : 'hidden'
          } group-hover:block`}
        />
        <div
          className={`absolute ${
            openMenu.id === id && openMenu.open ? 'block' : 'hidden'
          } -right-32 top-6 bg-gray-700 rounded-xl w-max p-2`}
        >
          <div
            onClick={renameHandler}
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
          >
            <Image src={assets.pencil_icon} alt="" className="w-4" />
            <p>重命名</p>
          </div>
          <div
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
            onClick={deleteHandler}
          >
            <Image src={assets.delete_icon} alt="" className="w-4" />
            <p>删除</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatLabel
