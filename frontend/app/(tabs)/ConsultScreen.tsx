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
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { chatHistoryService } from '../../services/chatHistoryService';
import { chatApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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
  const [activeTab, setActiveTab] = useState<'ai' | 'seller'>('seller');
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputSellerMessage, setInputSellerMessage] = useState('');
  const [sellerChatMessages, setSellerChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSellerTyping, setIsSellerTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [sellerMessages, setSellerMessages] = useState<ChatMessage[]>([]);
  const [sellerInput, setSellerInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthChecked(true);

      if (token) {
        const decoded = decodeToken(token);

        if (decoded) {
          setIsAuthenticated(true);
          const currentUserId = decoded.id;
          setUserId(currentUserId);
          setMyId(currentUserId);
          setIsSeller(decoded.role === UserRole.SELLER);

          if (decoded.role === UserRole.SELLER) {
            await loadChats();
          } else {
            chatHistoryService.setUserId(currentUserId.toString());
            const info = await chatApi.getSellerInfo();
            setSellerId(info.id);
            loadSellerChatHistory(currentUserId, info.id);
          }
          return;
        }

        await AsyncStorage.removeItem('token');
      }

      setIsAuthenticated(false);
      setIsSeller(false);
      setUserId(null);
      chatHistoryService.setUserId(null);
      setSellerId(null);
      loadSellerChatHistory(null, null);
    };
    checkAuth();
  }, []);
  useEffect(() => {
    if (!userId || activeTab !== 'seller' || sellerId === null) return;

    const interval = setInterval(() => {
      loadSellerChatHistory(userId, sellerId);
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, sellerId, activeTab]);

  useEffect(() => {
    if (!isSeller) return;

    loadChats();
    const chatListInterval = setInterval(loadChats, 10000);

    return () => clearInterval(chatListInterval);
  }, [isSeller]);

  useEffect(() => {
    if (!isSeller || activeUser === null) return;

    let active = true;
    const load = async () => {
      if (!active) return;
      await loadMessages(activeUser);
    };

    load();
    const msgInterval = setInterval(load, 2000);

    return () => {
      active = false;
      clearInterval(msgInterval);
      setSellerMessages([]);
    };
  }, [activeUser, isSeller]);

  const loadChatHistory = async () => {
    try {
      const history = await chatHistoryService.loadRecentMessages();
      setChatMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };
  const loadSellerChatHistory = async (
    currentUserId: number | null,
    currentSellerId: number | null
  ) => {
    try {
      if (!currentUserId || !currentSellerId) {
        setSellerChatMessages([]);
        return;
      }

      const history: ApiMessage[] = await chatApi.getMessagesWithSeller(
        currentSellerId
      );

      const formattedMessages: Message[] = history.map((msg: ApiMessage) => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        role: msg.senderId === currentUserId ? 'user' as const : 'seller' as const,
        text: msg.text,
        timestamp: new Date(msg.createdAt || Date.now()).getTime()
      }));

      setSellerChatMessages(formattedMessages);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserId(null);
        setSellerId(null);
      }
      console.error('Error loading seller chat history:', error);
    }
  };
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message: Message = { 
      role: 'user', 
      text: inputMessage.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, message]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // TODO: Implement AI chat endpoint
      const mockResponse = "This is a mock AI response. The AI chat endpoint is not implemented yet.";
      const aiMessage: Message = { 
        role: 'assistant', 
        text: mockResponse,
        timestamp: Date.now()
      };
      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const sendSellerMessage = async () => {
    if (!inputSellerMessage.trim() || !userId || sellerId === null) return;

    const text = inputSellerMessage.trim();
    setInputSellerMessage('');
    setIsSellerTyping(true);

    try {
      const response = await chatApi.sendMessageToSeller(sellerId, text);
      if (response) {
        const newMessage = {
          id: response.id,
          senderId: userId,
          receiverId: sellerId,
          role: 'user' as const,
          text,
          timestamp: new Date(response.createdAt).getTime()
        };
        setSellerChatMessages(prev => [...prev, newMessage]);
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserId(null);
        setSellerId(null);
      }
      console.error('Error sending message:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте еще раз.');
    } finally {
      setIsSellerTyping(false);
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
        message.role === 'seller' ? styles.sellerMessage :
        styles.assistantMessage
      ]}
    >
      <Text style={[
        styles.messageText,
        message.role === 'user' && styles.userMessageText
      ]}>
        {message.text}
      </Text>
      <Text style={[
        styles.messageTime,
        message.role === 'user' ? styles.userMessageTime : 
        message.role === 'seller' ? styles.sellerMessageTime :
        styles.assistantMessageTime
      ]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );
  const messageListRef = useRef<ScrollView>(null);

  const loadChats = async () => {
    if (!isSeller) return;

    try {
      const chatList = await chatApi.getSellerChats();
      setChats(chatList);
      setLoading(false);
    } catch (e: any) {
      console.error('Error loading chats', e);
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsSeller(false);
      }
      setLoading(false);
    }
  };

  const loadMessages = async (uid: number) => {
    if (!isSeller) return;

    try {
      const msgs = await chatApi.getMessagesWithUser(uid);
      setSellerMessages(msgs);
    } catch (e: any) {
      console.error('Error loading messages', e);
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsSeller(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToUser = async () => {
    if (!sellerInput.trim() || activeUser === null) return;

    const text = sellerInput.trim();
    setSellerInput('');

    try {
      const response = await chatApi.sendMessageToUser(activeUser, text);
      if (response) {
        setSellerMessages(prev => [...prev, response]);
      }
    } catch (e: any) {
      console.error('Error sending message', e);
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setIsSeller(false);
      }
    }
  };

  const renderChatContent = (
    messages: Message[], 
    inputValue: string, 
    setInputValue: (value: string) => void,
    onSend: () => void,
    isTypingState: boolean,
    typingText: string
  ) => {
    if (!isAuthenticated) {
      return (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>
            Для использования чата необходимо авторизоваться
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
        <ScrollView          ref={messageListRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <Text style={styles.emptyChatText}>
              Начните диалог
            </Text>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isTypingState && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#0066cc" />
                  <Text style={styles.typingText}>{typingText}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Введите сообщение..."
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!inputValue.trim() || isTypingState}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputValue.trim() ? '#fff' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'seller' && styles.activeTab]}
        onPress={() => setActiveTab('seller')}
      >
        <Ionicons 
          name="people" 
          size={20} 
          color={activeTab === 'seller' ? '#fff' : '#666'} 
          style={styles.tabIcon}
        />
        <Text style={[styles.tabText, activeTab === 'seller' && styles.activeTabText]}>
          Чат с продавцом
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
        onPress={() => setActiveTab('ai')}
      >
        <Ionicons 
          name="help-circle" 
          size={20} 
          color={activeTab === 'ai' ? '#fff' : '#666'} 
          style={styles.tabIcon}
        />
        <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
          AI Помощник
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthChecked) return null;

  if (isSeller) {
    if (activeUser === null) {
      return (
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : chats.length > 0 ? (
            <>
              <Text style={styles.title}>Активные чаты</Text>
              <FlatList
                data={chats}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.chatItem}
                    onPress={() => {
                      setActiveUser(item.userId);
                      loadMessages(item.userId);
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={24} color="#666" />
                    <View style={styles.chatItemContent}>
                      <Text style={styles.chatItemName}>{item.userName}</Text>
                      {item.lastMessage && (
                        <Text style={styles.chatItemLastMessage} numberOfLines={1}>
                          {item.lastMessage.text}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Нет активных чатов</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveUser(null)}>
            <Ionicons name="arrow-back" size={24} color="#2196F3" />
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Пользователь {activeUser}</Text>
        </View>

        <FlatList
          data={sellerMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={myId === item.senderId ? styles.messageSeller : styles.messageUser}>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={sellerInput}
            onChangeText={setSellerInput}
            placeholder="Введите сообщение..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !sellerInput.trim() && styles.sendButtonDisabled]}
            onPress={sendMessageToUser}
            disabled={!sellerInput.trim()}
          >
            <Ionicons name="send" size={20} color={sellerInput.trim() ? '#fff' : '#999'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabs()}
      {activeTab === 'seller'
        ? renderChatContent(
            sellerChatMessages,
            inputSellerMessage,
            setInputSellerMessage,
            sendSellerMessage,
            isSellerTyping,
            'Продавец печатает...'
          )
        : renderChatContent(
            chatMessages,
            inputMessage,
            setInputMessage,
            sendMessage,
            isTyping,
            'AI помощник печатает...'
          )}

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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  sellerMessageTime: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  assistantMessageTime: {
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
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
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
    backgroundColor: '#E9E9EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '92%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatItemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  chatItemLastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageSeller: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
