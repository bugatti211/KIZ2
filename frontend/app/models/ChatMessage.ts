export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: Date;
}
