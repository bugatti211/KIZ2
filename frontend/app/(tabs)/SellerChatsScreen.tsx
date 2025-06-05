import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { chatApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../constants/Roles';
import { useRouter } from 'expo-router';

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

      try {
        const data = JSON.parse(atob(token.split('.')[1]));
        setMyId(data.id);
        
        if (data.role === UserRole.SELLER) {
          setIsSeller(true);
          loadChats();
        } else {
          router.replace('/(tabs)/ConsultScreen');
        }
      } catch (e) {
        console.error('Error parsing token:', e);
        router.replace('/(tabs)/ConsultScreen');
      }
    } catch (e) {
      console.error('Error loading user data:', e);
      router.replace('/(tabs)/ConsultScreen');
    }
  };
  const loadChats = async () => {
    if (!isSeller) {
      router.replace('/(tabs)/ConsultScreen');
      return;
    }
      try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const chatList = await chatApi.getSellerChats();
      if (isComponentMounted) {
        setChats(chatList.chats || []);
        setLoading(false);
      }
    } catch (e: any) {
      console.error('Error loading chats:', e);
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        router.replace('/(auth)/login');
      } else if (e?.response?.status === 403) {
        router.replace('/(tabs)/ConsultScreen');
      } else {
        Alert.alert(
          'Ошибка',
          'Не удалось загрузить список чатов. Попробуйте позже.',
          [{ text: 'OK' }]
        );
      }
      setLoading(false);
    }
  };
    const loadMessages = async (userId: number) => {
    if (!isSeller) {
      router.replace('/(tabs)/ConsultScreen');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }      const msgs = await chatApi.getMessagesWithUser(userId);
      if (isComponentMounted) {
        setMessages(msgs);
      }
    } catch (e) {
      console.error('Error loading messages', e);
      if ((e as any)?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        router.replace('/(auth)/login');
      } else if ((e as any)?.response?.status === 403) {
        Alert.alert(
          'Ошибка доступа',
          'У вас нет прав для просмотра сообщений',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/ConsultScreen') }]
        );
      } else {
        Alert.alert(
          'Ошибка',
          'Не удалось загрузить сообщения. Попробуйте позже.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  // Обновляем список активных чатов каждые 10 секунд только если страница активна
  useEffect(() => {
    if (!isSeller) {
      router.replace('/(tabs)/ConsultScreen');
      return;
    }

    const chatListInterval = setInterval(loadChats, 10000);
    return () => {
      clearInterval(chatListInterval);
    };
  }, [isSeller]);

  // Обновляем сообщения активного чата каждые 2 секунды только если пользователь выбран
  useEffect(() => {
    if (!isSeller) {
      router.replace('/(tabs)/ConsultScreen');
      return;
    }

    if (activeUser === null) return;

    loadMessages(activeUser); // Initial load
    const messageInterval = setInterval(() => loadMessages(activeUser), 2000);
    return () => {
      clearInterval(messageInterval);
    };
  }, [activeUser, isSeller]);

  // Загрузка начальных данных  // Cleanup function to prevent memory leaks and state updates on unmounted component
  const [isComponentMounted, setIsComponentMounted] = useState(true);

  useEffect(() => {
    loadUserData();
    return () => {
      setIsComponentMounted(false);
    };
  }, []);
  const sendMessage = async () => {
    if (!input.trim() || activeUser === null) return;
    
    const text = input.trim();
    setInput('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }      const response = await chatApi.sendMessageToUser(activeUser, text);
      if (response && isComponentMounted) {
        setMessages(prev => [...prev, response]);
      }
    } catch (e: any) {
      console.error('Error sending message', e);
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        router.replace('/(auth)/login');
      } else if (e?.response?.status === 403) {
        Alert.alert(
          'Ошибка доступа',
          'У вас нет прав для отправки сообщений',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/ConsultScreen') }]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте еще раз.');
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (activeUser === null) {
    return (
      <View style={styles.container}>
        {chats.length > 0 ? (
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
        <Text style={styles.headerTitle}>
          {chats.find(chat => chat.userId === activeUser)?.userName || `Пользователь ${activeUser}`}
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  }
});
