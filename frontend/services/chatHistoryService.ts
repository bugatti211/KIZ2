import api from '../app/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

class ChatHistoryService {
  async saveMessage(message: Omit<ChatMessage, 'timestamp'>): Promise<void> {
    try {
      await api.post('/api/chat/messages', message);
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async loadRecentMessages(): Promise<ChatMessage[]> {
    try {
      const response = await api.get('/api/chat/messages');
      return response.data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp).getTime()
      }));
    } catch (error) {
      console.error('Error loading recent messages:', error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await api.delete('/api/chat/messages');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
