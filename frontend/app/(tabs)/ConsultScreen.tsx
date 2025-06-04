import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking, 
  Alert, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getContacts } from '../authApi';
import { yandexGptService } from '../../services/yandexGptService';
import { chatHistoryService, ChatMessage } from '../../services/chatHistoryService';
import { chatApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ConsultScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('employee');
  const [contacts, setContacts] = useState({ telegram: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const SELLER_ID = 1;
  const [inputSellerMessage, setInputSellerMessage] = useState('');
  const [sellerChatMessages, setSellerChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
      setIsAuthChecked(true);
      if (token) {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        chatHistoryService.setUserId(tokenData.id); // Set the user ID for chat history
        loadChatHistory();
        loadSellerChatHistory(tokenData.id);
      } else {
        chatHistoryService.setUserId(null); // Clear the user ID when not authenticated
        loadSellerChatHistory(null);
      }
    };
    checkAuth();
    loadContacts(); // Загружаем контакты всегда, независимо от авторизации
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await chatHistoryService.loadRecentMessages();
      setChatMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadSellerChatHistory = async (userId: number | null) => {
    try {
      if (!userId) {
        setSellerChatMessages([]);
        return;
      }
      const history = await chatApi.getMessagesWithSeller(SELLER_ID);
      setSellerChatMessages(history);
    } catch (error) {
      console.error('Error loading seller chat history:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const contactsData = await getContacts();
      setContacts(contactsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить контактные данные');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    if (contacts.telegram) {
      Linking.openURL(`https://t.me/${contacts.telegram}`);
    }
  };

  const openWhatsApp = () => {
    if (contacts.whatsapp) {
      Linking.openURL(`https://wa.me/${contacts.whatsapp}`);
    }
  };
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Omit<ChatMessage, 'timestamp'> = { 
      role: 'user', 
      text: inputMessage.trim() 
    };

    try {
      await chatHistoryService.saveMessage(userMessage);
      setChatMessages(prev => [...prev, { ...userMessage, timestamp: Date.now() }]);
      setInputMessage('');
      setIsTyping(true);

      const response = await yandexGptService.sendMessage(userMessage.text);
      const assistantMessage: Omit<ChatMessage, 'timestamp'> = { 
        role: 'assistant', 
        text: response 
      };
      
      await chatHistoryService.saveMessage(assistantMessage);
      setChatMessages(prev => [...prev, { ...assistantMessage, timestamp: Date.now() }]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить ответ от ассистента');
    } finally {
      setIsTyping(false);
    }
  };

  const sendSellerMessage = async () => {
    if (!inputSellerMessage.trim()) return;

    const text = inputSellerMessage.trim();

    try {
      await chatApi.sendMessageToSeller(SELLER_ID, text);
      setSellerChatMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
      setInputSellerMessage('');
      setIsTyping(false);
      const history = await chatApi.getMessagesWithSeller(SELLER_ID);
      setSellerChatMessages(history);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    }
  };
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const clearHistory = async () => {
    try {
      await chatHistoryService.clearHistory();
      setChatMessages([]);
      Alert.alert('Успех', 'История чата очищена');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось очистить историю чата');
    }
  };

  const clearSellerHistory = async () => {
    try {
      // There is no backend endpoint to clear history, just reload
      setSellerChatMessages([]);
      Alert.alert('Успех', 'История чата очищена');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось очистить историю чата');
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => (
    <View 
      key={index} 
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage
      ]}
    >
      <Text style={[
        styles.messageText,
        message.role === 'user' && styles.userMessageText
      ]}>{message.text}</Text>
      <Text style={[
        styles.messageTime,
        message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
      ]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );  const renderContent = () => {
    switch (activeTab) {
      case 'employee':
        return (
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {renderSellerHeader()}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {sellerChatMessages.map(renderMessage)}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#0066cc" />
                  <Text style={styles.typingText}>Продавец печатает...</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputSellerMessage}
                onChangeText={setInputSellerMessage}
                placeholder="Введите сообщение..."
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputSellerMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendSellerMessage}
                disabled={!inputSellerMessage.trim() || isTyping}
              >
                <FontAwesome5
                  name="arrow-up"
                  size={16}
                  color={inputSellerMessage.trim() ? 'white' : '#ccc'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        );
      case 'ai':
        if (!isAuthenticated) {
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>
                Для использования AI помощника необходимо авторизоваться
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
            {renderHeader()}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map(renderMessage)}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#0066cc" />
                  <Text style={styles.typingText}>Ассистент печатает...</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Введите сообщение..."
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                <FontAwesome5 
                  name="arrow-up" 
                  size={16} 
                  color={inputMessage.trim() ? 'white' : '#ccc'} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        );
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View style={styles.chatHeader}>
      <Text style={styles.chatTitle}>Чат с AI помощником</Text>
      {chatMessages.length > 0 && (
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <FontAwesome5 name="trash" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSellerHeader = () => (
    <View style={styles.chatHeader}>
      <Text style={styles.chatTitle}>Чат с продавцом</Text>
      {sellerChatMessages.length > 0 && (
        <TouchableOpacity onPress={clearSellerHistory} style={styles.clearButton}>
          <FontAwesome5 name="trash" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'employee' && styles.activeTab
        ]}
        onPress={() => setActiveTab('employee')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'employee' && styles.activeTabText
        ]}>Сотрудник</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'ai' && styles.activeTab,
          !isAuthenticated && styles.disabledTab
        ]}
        onPress={() => {
          if (!isAuthenticated) {
            setShowAuth(true);
          } else {
            setActiveTab('ai');
          }
        }}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'ai' && styles.activeTabText,
          !isAuthenticated && styles.disabledTabText
        ]}>AI помощник</Text>
      </TouchableOpacity>
    </View>
  );
  if (!isAuthChecked) return null;
  return (
    <View style={styles.container}>
      {renderTabs()}
      {renderContent()}

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
              Для использования AI помощника необходимо войти в аккаунт
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contentText: {
    fontSize: 18,
    marginBottom: 20,
  },
  contactButtons: {
    width: '100%',
    gap: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#ff3b30',
    fontSize: 14,
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
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000', // Default color for assistant messages
  },
  userMessageText: {
    color: '#FFFFFF', // White text for user messages
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
    color: '#8E8E93',
    textAlign: 'left',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  disabledTab: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  disabledTabText: {
    color: '#999',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
  },
});
