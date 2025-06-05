import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { chatApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../constants/Roles';
import { useRouter } from 'expo-router';
import { decodeToken } from '../utils/tokenUtils';

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
}

interface ChatInfo {
  userId: number;
  userName: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export default function SellerChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  // Загрузка ID и роли текущего пользователя из токена
  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/(tabs)/ConsultScreen');
        return;
      }

      const data = decodeToken(token);
      if (data) {
        setMyId(data.id);

        if (data.role === UserRole.SELLER) {
          setIsSeller(true);
          await loadChats(); // Immediately load chats when we confirm seller role
        } else {
          Alert.alert(
            'Переадресация',
            'Для общения с продавцом перейдите в раздел "Консультация"',
            [{
              text: 'Перейти',
              onPress: () => router.replace('/(tabs)/ConsultScreen'),
            }]
          );
        }
      } else {
        await AsyncStorage.removeItem('token');
        router.replace('/(tabs)/ConsultScreen');
      }
    } catch (e) {
      console.error('Error loading user data:', e);
      router.replace('/(tabs)/ConsultScreen');
    }
  };

  const loadChats = async () => {
    if (!isSeller) return;
    
    try {
      const chatList = await chatApi.getSellerChats();
      setChats(chatList);
      setLoading(false);
    } catch (e) {
      console.error('Error loading chats', e);
      if ((e as any)?.response?.status === 403) {
        Alert.alert(
          'Ошибка доступа',
          'У вас нет прав для просмотра чатов',
          [{ text: 'OK' }]
        );
      }
      setLoading(false);
    }
  };
  
  const loadMessages = async (userId: number) => {
    if (!isSeller) return;
    
    try {
      const msgs = await chatApi.getMessagesWithUser(userId);
      setMessages(msgs);
    } catch (e) {
      console.error('Error loading messages', e);
      if ((e as any)?.response?.status === 403) {
        Alert.alert(
          'Ошибка доступа',
          'У вас нет прав для просмотра сообщений',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Обновляем список активных чатов каждые 10 секунд
  useEffect(() => {
    if (!isSeller) return;

    loadChats(); // Начальная загрузка
    const chatListInterval = setInterval(loadChats, 10000);

    return () => clearInterval(chatListInterval);
  }, [isSeller]);

  // Обновляем сообщения активного чата каждые 2 секунды с улучшенной очисткой
  useEffect(() => {
    if (!isSeller || activeUser === null) return;

    let isSubscribed = true;

    const loadMessagesIfActive = async () => {
      if (!isSubscribed) return;
      await loadMessages(activeUser);
    };

    loadMessagesIfActive(); // Initial load
    const messageInterval = setInterval(loadMessagesIfActive, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(messageInterval);
      setMessages([]); // Clear messages when switching users
    };
  }, [activeUser, isSeller]);

  // Загрузка начальных данных
  useEffect(() => {
    loadUserData();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || activeUser === null) return;
    
    const text = input.trim();
    setInput('');
    
    try {
      const response = await chatApi.sendMessageToUser(activeUser, text);
      if (response) {
        setMessages(prev => [...prev, response]);
      }
    } catch (e) {
      console.error('Error sending message', e);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте еще раз.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

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
              keyExtractor={item => item.userId.toString()}
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setActiveUser(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#2196F3" />
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Пользователь {activeUser}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={myId === item.senderId ? styles.messageSeller : styles.messageUser}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
      />

      <View style={styles.inputRow}>
        <TextInput 
          style={styles.input} 
          value={input} 
          onChangeText={setInput} 
          placeholder="Введите сообщение..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={input.trim() ? "#fff" : "#999"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
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
  messagesContainer: {
    padding: 16,
  },
  inputRow: { 
    flexDirection: 'row', 
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8, 
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendButton: { 
    backgroundColor: '#2196F3', 
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
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
  messageText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
