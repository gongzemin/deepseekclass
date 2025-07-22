import connectDB from '@/config/db'
import Chat from '@/models/Chat'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ message: '用户未授权', success: false })
    }
    await connectDB()
    const data = await Chat.find({ userId })
    return NextResponse.json({ success: true, data }) // return NextResponse.json(chats, { status: 200 })
  } catch (error: unknown) {
    let errorMessage = ''
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json({ message: errorMessage, success: false })
  }
}
