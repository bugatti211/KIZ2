import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../api';
import { SELLER_ID } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { yandexGptService } from '../../services/yandexGptService';
import { AI_ASSISTANT_CONTEXT, INITIAL_AI_MESSAGE } from '../config/aiAssistant';
import { decodeToken } from '../utils/tokenUtils';

interface Message {
  id?: number;
  senderId?: number;
  receiverId?: number;
  role: 'user' | 'seller' | 'assistant';
  text: string;
  timestamp: number;
  createdAt?: string;
}

interface ApiMessage {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
}

export default function ConsultScreen() {
  const router = useRouter();
  const messageListRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [useAiAssistant, setUseAiAssistant] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setUserId(null);
          setMessages([]);
          setIsAuthChecked(true);
          return;
        }        try {
          const tokenData = decodeToken(token);
          if (!tokenData) {
            throw new Error('Invalid token data');
          }
          const currentUserId = tokenData.id;
          setIsAuthenticated(true);
          setUserId(currentUserId);
          setIsAuthChecked(true);
          loadChatHistory(currentUserId);
        } catch (e) {
          console.error('Invalid token:', e);
          await AsyncStorage.removeItem('token');
          setIsAuthenticated(false);
          setUserId(null);
          setMessages([]);
          setIsAuthChecked(true);
          router.replace("/(auth)/login");
        }
      } catch (e) {
        console.error('Error checking auth:', e);
        setIsAuthenticated(false);
        setUserId(null);
        setMessages([]);
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!userId || useAiAssistant) return;

    const interval = setInterval(() => {
      loadChatHistory(userId);
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, useAiAssistant]);

  const loadChatHistory = async (currentUserId: number | null) => {
    if (useAiAssistant || !currentUserId) {
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUserId(null);
        setMessages([]);
        return;
      }

      const history: ApiMessage[] = await chatApi.getMessagesWithSeller(SELLER_ID);
      const formattedMessages: Message[] = history.map((msg: ApiMessage) => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        role: msg.senderId === currentUserId ? 'user' : 'seller',
        text: msg.text,
        timestamp: new Date(msg.createdAt || Date.now()).getTime()
      }));
      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      if (error?.response?.status === 401) {
        // Token expired or invalid
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserId(null);
        setMessages([]);
        setShowAuth(true);
      } else {
        Alert.alert(
          'Ошибка', 
          'Не удалось загрузить историю чата. Пожалуйста, попробуйте позже.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      if (useAiAssistant) {
        try {
          // Get response from AI
          const aiResponse = await yandexGptService.sendMessage(
            `${AI_ASSISTANT_CONTEXT}\n\nUser: ${text}\nAssistant:`
          );
          
          const assistantMessage: Message = {
            role: 'assistant',
            text: aiResponse,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Error getting AI response:', error);
          Alert.alert(
            'Ошибка',
            'Не удалось получить ответ от AI-помощника. Переключаюсь на чат с продавцом...'
          );
          setUseAiAssistant(false);
        }
      } else {
        // Regular chat with seller
        if (!userId) {
          setIsAuthenticated(false);
          setShowAuth(true);
          return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setShowAuth(true);
          return;
        }

        const response = await chatApi.sendMessageToSeller(SELLER_ID, text);
        if (response) {
          const newMessage: Message = {
            id: response.id,
            senderId: userId,
            receiverId: SELLER_ID,
            role: 'user',
            text,
            timestamp: new Date(response.createdAt).getTime()
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserId(null);
        setShowAuth(true);
      } else {
        Alert.alert(
          'Ошибка', 
          'Не удалось отправить сообщение. Пожалуйста, попробуйте позже.'
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message: Message, index: number) => (
    <View 
      key={index} 
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : 
        message.role === 'assistant' ? styles.assistantMessage : styles.sellerMessage
      ]}
    >                  <Text style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : 
                    message.role === 'assistant' ? styles.assistantMessageText : null
                  ]}>
                    {message.text}
                  </Text>
      <Text style={[
        styles.messageTime,
        message.role === 'user' ? styles.userMessageTime : 
        message.role === 'assistant' ? styles.assistantMessageTime : styles.sellerMessageTime
      ]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );

  const renderChatContent = () => {
    if (!useAiAssistant && !isAuthenticated) {
      return (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>
            Для использования чата с продавцом необходимо авторизоваться
          </Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => setShowAuth(true)}
          >
            <Text style={styles.authButtonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={messageListRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <Text style={styles.emptyChatText}>
              {isLoading ? 'Загрузка...' : 'Начните диалог'}
            </Text>
          ) : (
            <>
              {messages.map((message, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.messageContainer,
                    message.role === 'user' ? styles.userMessage : 
                    message.role === 'assistant' ? styles.assistantMessage : 
                    styles.sellerMessage
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : 
                    message.role === 'assistant' && styles.assistantMessageText
                  ]}>
                    {message.text}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    message.role === 'user' ? styles.userMessageTime : 
                    message.role === 'assistant' ? styles.assistantMessageTime : 
                    styles.sellerMessageTime
                  ]}>
                    {formatMessageTime(message.timestamp)}
                  </Text>
                </View>
              ))}
              {isSending && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#0066cc" />
                  <Text style={styles.typingText}>
                    {useAiAssistant ? 'AI помощник печатает...' : 'Отправка...'}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder={useAiAssistant ? 
              "Задайте вопрос AI-помощнику..." : 
              "Введите сообщение для продавца..."}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isSending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputMessage.trim() && !isSending ? '#fff' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Add initial AI message
  useEffect(() => {
    if (useAiAssistant && messages.length === 0) {
      const initialMessage: Message = {
        role: 'assistant',
        text: INITIAL_AI_MESSAGE,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    }
  }, [useAiAssistant]);

  if (!isAuthChecked) return null;

  return (
    <View style={styles.container}>      <View style={styles.header}>
        <Text style={[styles.title, { flex: 1 }]}>
          {useAiAssistant ? 'Чат с AI-помощником' : 'Чат с продавцом'}
        </Text>
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => {
            setUseAiAssistant(!useAiAssistant);
            setMessages([]); // Clear messages when switching
          }}
        >
          <Text style={styles.switchButtonText}>
            {useAiAssistant ? 'Переключиться на продавца' : 'Переключиться на AI'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderChatContent()}

      <Modal visible={showAuth} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Вход в аккаунт</Text>
              <Pressable onPress={() => setShowAuth(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.modalText}>
              Для использования чата необходимо войти в аккаунт
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowAuth(false);
                router.push("/(auth)/login");
              }}
              style={styles.authButton}
            >
              <Text style={styles.authButtonText}>Войти</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setShowAuth(false);
                router.push("/(auth)/register");
              }}
              style={[styles.authButton, styles.registerButton]}
            >
              <Text style={styles.authButtonText}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  switchButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  switchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  sellerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#2E7D32',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: '#81C784',
    textAlign: 'left',
  },
  sellerMessageTime: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  emptyChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  typingText: {
    marginLeft: 8,
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 24,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});
