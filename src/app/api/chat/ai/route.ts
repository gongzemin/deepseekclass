export const maxDuration = 60
import Chat from '@/models/Chat'
import OpenAI from 'openai'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/config/db'

interface ExtendedChatMessage extends OpenAI.ChatCompletionMessage {
  timestamp: number
}

// 初始化OpenAI客户端，配置DeepSeek API
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
})

// 处理POST请求
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req) // 从请求中获取用户ID
    // 从请求体中提取chatId和prompt
    const { chatId, prompt } = await req.json()

    // 检查用户是否授权
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: '用户未授权',
      })
    }

    // 连接数据库并查找聊天记录
    await connectDB()
    const data = await Chat.findOne({ userId, _id: chatId })

    // 创建用户消息对象
    const userPrompt = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(), // 添加时间戳
    }
    data.messages.push(userPrompt) // 将用户消息添加到聊天记录
    await data.save()

    // 设置SSE响应头
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }

    // 创建可写流来处理SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用DeepSeek API获取流式聊天回复
          const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'deepseek-chat',
            stream: true,
            store: true,
          })

          let fullContent = ''

          // 处理流式响应
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              // 发送SSE事件
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ content })}\n\n`
                )
              )
            }
          }

          // 保存AI回复到数据库
          const message = {
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          } as ExtendedChatMessage

          data.messages.push(message)
          await data.save()

          // 发送最终消息
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ success: true, data: message })}\n\n`
            )
          )

          // 关闭流
          controller.close()
        } catch (error) {
          // 错误处理
          let errorMessage = '聊天回复失败'
          if (error instanceof Error) {
            errorMessage = error.message
          }
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                success: false,
                error: errorMessage,
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new NextResponse(stream, { headers })
  } catch (error) {
    // 初始错误处理
    let errorMessage = '聊天回复失败'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json({
      success: false,
      error: errorMessage,
    })
  }
}
