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

    const { chatId } = await req.json()

    // Connect to the database and delete the chat
    await connectDB()
    await Chat.findOneAndDelete({ _id: chatId, userId })

    return NextResponse.json({
      success: true,
      message: '聊天删除成功',
    })
  } catch (error: unknown) {
    let errorMessage = '删除聊天失败'
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
