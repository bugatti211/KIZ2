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
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getContacts } from '../authApi';
import { yandexGptService } from '../../services/yandexGptService';
import { chatHistoryService, ChatMessage } from '../../services/chatHistoryService';

export default function ConsultScreen() {
  const [activeTab, setActiveTab] = useState('employee');
  const [contacts, setContacts] = useState({ telegram: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadContacts();
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await chatHistoryService.loadRecentMessages();
      setChatMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
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

  const renderMessage = (message: ChatMessage, index: number) => (
    <View 
      key={index} 
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage
      ]}
    >
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={[
        styles.messageTime,
        message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
      ]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'employee':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>Связаться с сотрудником</Text>
            {loading ? (
              <Text>Загрузка контактов...</Text>
            ) : (
              <View style={styles.contactButtons}>                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#0088cc' }]}
                  onPress={openTelegram}
                >
                  <FontAwesome5 name="telegram" size={24} color="white" />
                  <Text style={styles.buttonText}>Telegram</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                  onPress={openWhatsApp}
                >
                  <FontAwesome5 name="whatsapp" size={24} color="white" />
                  <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );      case 'ai':
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
            <View style={styles.inputContainer}>              <TextInput
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
          activeTab === 'ai' && styles.activeTab
        ]}
        onPress={() => setActiveTab('ai')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'ai' && styles.activeTabText
        ]}>AI помощник</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabs()}
      {renderContent()}
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
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
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
});
