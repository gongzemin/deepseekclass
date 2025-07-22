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

    const { chatId, name } = await req.json()
    await connectDB()
    // connect to the database and update the chat name
    await Chat.findOneAndUpdate({ _id: chatId, userId }, { name })
    return NextResponse.json({
      success: true,
      message: '聊天重命名成功',
    })
  } catch (error: unknown) {
    let errorMessage = '重命名聊天失败'
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
