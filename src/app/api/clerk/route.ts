import { Webhook } from 'svix'
import connectDB from '@/config/db'
import User from '@/models/User'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface SvixEvent {
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name: string
    last_name: string
    image_url: string
  }
  type: 'user.created' | 'user.updated' | 'user.deleted'
}

export async function POST(req: NextRequest) {
  // 验证环境变量是否存在
  const signingSecret = process.env.SIGNING_SECRET
  if (!signingSecret) {
    return NextResponse.json(
      { error: '没有找到 SIGNING_SECRET 环境变量' },
      { status: 500 }
    )
  }

  const wh = new Webhook(signingSecret)
  const headerPayload = await headers()

  // 获取必要的 Svix 头部信息
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: '没有找到必要的 Svix 头部信息' },
      { status: 400 }
    )
  }

  const svixHeaders = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  }

  // 获取请求体并转换为字符串
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // 验证请求的有效性
  const { data, type } = wh.verify(body, svixHeaders) as SvixEvent

  // 准备用户数据
  const userData = {
    _id: data.id,
    email: data.email_addresses[0].email_address,
    name: `${data.first_name} ${data.last_name}`,
    image: data.image_url,
  }

  await connectDB()

  // 处理不同类型的事件
  switch (type) {
    case 'user.created':
      await User.create(userData)
      break
    case 'user.updated':
      await User.findByIdAndUpdate(data.id, userData)
      break
    case 'user.deleted':
      await User.findByIdAndDelete(data.id)
      break
    default:
      break
  }

  return NextResponse.json({
    message: 'Event received',
  })
}
