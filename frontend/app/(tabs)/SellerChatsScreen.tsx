import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { chatApi } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../services/chatHistoryService';

export default function SellerChatsScreen() {
  const [userIds, setUserIds] = useState<number[]>([]);
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const loadChats = async () => {
    try {
      const ids = await chatApi.getSellerChats();
      setUserIds(ids);
    } catch (e) {
      console.error('Error loading chats', e);
    }
  };

  const loadMessages = async (userId: number) => {
    setLoading(true);
    try {
      const msgs = await chatApi.getMessagesWithUser(userId);
      setMessages(msgs);
    } catch (e) {
      console.error('Error loading messages', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || activeUser === null) return;
    const text = input.trim();
    setInput('');
    try {
      await chatApi.sendMessageToUser(activeUser, text);
      await loadMessages(activeUser);
    } catch (e) {
      console.error('Error sending message', e);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  if (activeUser === null) {
    return (
      <View style={styles.container}>
        <FlatList
          data={userIds}
          keyExtractor={(id) => id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => { setActiveUser(item); loadMessages(item); }}>
              <Text>Пользователь {item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator style={{ margin: 10 }} />}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => String(index)}
        renderItem={({ item }) => (
          <View style={item.senderId === activeUser ? styles.messageUser : styles.messageSeller}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Сообщение" />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={{ color: '#fff' }}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  inputRow: { flexDirection: 'row', paddingVertical: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginRight: 8, paddingHorizontal: 8 },
  sendButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 4 },
  messageUser: { alignSelf: 'flex-start', backgroundColor: '#eee', padding: 8, marginVertical: 4, borderRadius: 4 },
  messageSeller: { alignSelf: 'flex-end', backgroundColor: '#cce5ff', padding: 8, marginVertical: 4, borderRadius: 4 }
});
