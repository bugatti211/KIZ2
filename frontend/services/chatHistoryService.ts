import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const CHAT_HISTORY_KEY = 'chat_history';
const DAYS_TO_KEEP = 30;

class ChatHistoryService {
  private async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  async saveMessage(message: Omit<ChatMessage, 'timestamp'>): Promise<void> {
    try {
      const history = await this.getChatHistory();
      const newMessage: ChatMessage = {
        ...message,
        timestamp: Date.now()
      };
      
      // Add new message
      history.push(newMessage);
      
      // Remove messages older than 30 days
      const thirtyDaysAgo = Date.now() - (DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
      const filteredHistory = history.filter(msg => msg.timestamp >= thirtyDaysAgo);
      
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async loadRecentMessages(): Promise<ChatMessage[]> {
    try {
      const history = await this.getChatHistory();
      const thirtyDaysAgo = Date.now() - (DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
      return history.filter(msg => msg.timestamp >= thirtyDaysAgo);
    } catch (error) {
      console.error('Error loading recent messages:', error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
