import mongoose from 'mongoose'

const ChatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    messages: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    userId: { type: String, required: true },
  },
  { timestamps: true }
)
const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema)
export default Chat
