export interface MessageType {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}
