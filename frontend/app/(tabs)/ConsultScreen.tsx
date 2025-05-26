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

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employee' && styles.activeTab]}
          onPress={() => setActiveTab('employee')}
        >
          <Text style={[styles.tabText, activeTab === 'employee' && styles.activeTabText]}>
            Сотрудник
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            AI помощник
          </Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  contentText: {
    fontSize: 18,
    marginBottom: 20,
  },
  contactButtons: {
    width: '100%',
    gap: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066cc',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  typingText: {
    color: '#666',
    fontSize: 14,
  },  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingRight: 45,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    bottom: 14,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  assistantMessageTime: {
    color: '#999',
    alignSelf: 'flex-start',
  },
});
