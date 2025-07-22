/**
 * 确保整个应用生命周期中只创建一个 MongoDB 连接实例，避免重复连接导致的性能问题。
 * 在开发环境中，Next.js 的热重载会重新执行代码，导致多次调用 mongoose.connect()，创建大量连接。
 * 因此，使用全局变量缓存连接实例。
 */
import mongoose, { Connection } from 'mongoose'
interface Cache {
  conn: Connection | null
  promise: Promise<Connection> | null
}

// Extend the global object type
declare global {
  let mongoose: Cache | undefined
}

// Use global variable or initialize it
const globalWithMongoose = global as typeof globalThis & { mongoose?: Cache }

const cached: Cache = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
}

export default async function connectDB(): Promise<Connection> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI!)
      .then(m => m.connection)
  }

  try {
    cached.conn = await cached.promise
    globalWithMongoose.mongoose = cached
    return cached.conn
  } catch (err) {
    cached.promise = null
    throw err
  }
}
