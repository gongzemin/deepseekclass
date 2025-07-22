import connectDB from '@/config/db'
import Chat from '@/models/Chat'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: '用户未授权',
      })
    }
    const chatData = {
      userId,
      messages: [],
      name: '新聊天', // Default chat name
    }
    await connectDB()
    await Chat.create(chatData)
    return NextResponse.json({
      success: true,
      message: '聊天创建成功',
    })
  } catch (error: unknown) {
    let errorMessage = '创建聊天失败'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
