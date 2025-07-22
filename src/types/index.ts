export interface MessageType {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}
export type OpenMenuState = {
  id: string | null
  open: boolean
}
