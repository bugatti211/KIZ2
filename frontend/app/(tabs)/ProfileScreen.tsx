import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import LoginScreen from '../LoginScreen';
import RegisterScreen from '../RegisterScreen';

interface ProfileScreenProps {
  setIsAuthenticated?: (v: boolean) => void;
  navigation?: any;
  route?: any;
}

export default function ProfileScreen({ setIsAuthenticated, navigation, route }: ProfileScreenProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [adText, setAdText] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showModeration, setShowModeration] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Получить объявления на модерацию
  const fetchAds = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Нет токена');
      const res = await api.get('/ads/moderation');
      setAds(res.data);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки объявлений');
    } finally {
      setLoading(false);
    }
  };

  // Получить данные пользователя
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Нет токена');
      const res = await api.get('/users');
      // Найти пользователя по email из токена
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentUser = res.data.find((u: any) => u.email === tokenPayload.email);
      setUser(currentUser || null);
    } catch (e) {
      // не критично, можно не показывать ошибку
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAds();
  }, []);

  // Создать объявление
  const handleCreate = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/ads', { text: adText, phone: adPhone });
      setShowCreate(false);
      setAdText('');
      setAdPhone('');
      fetchAds();
    } catch (e: any) {
      setError(e.message || 'Ошибка создания объявления');
    } finally {
      setSubmitting(false);
    }
  };

  // Подтвердить объявление
  const handleApprove = async (id: number) => {
    await api.post(`/ads/${id}/approve`);
    fetchAds();
  };
  // Отклонить объявление
  const handleReject = async (id: number) => {
    await api.post(`/ads/${id}/reject`);
    fetchAds();
  };

  // Стили должны быть определены до использования
  const styles = StyleSheet.create({
    createBlock: {
      backgroundColor: '#f9f9f9',
      borderRadius: 12,
      padding: 18,
      marginBottom: 18,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    moderationBlock: {
      backgroundColor: '#e3f2fd',
      borderRadius: 12,
      padding: 16,
      marginBottom: 18,
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      width: '92%',
      maxWidth: 400,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      fontSize: 16,
      width: '100%',
    },
    adBlock: {
      backgroundColor: '#f2f2f2',
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    approveBtn: {
      backgroundColor: '#4caf50',
      padding: 8,
      borderRadius: 6,
      marginRight: 10,
    },
    rejectBtn: {
      backgroundColor: '#e53935',
      padding: 8,
      borderRadius: 6,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333',
    },
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Имя пользователя */}
      <View style={styles.createBlock}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center' }}>
          {user && user.name ? `Здравствуйте, ${user.name}!` : user === null ? 'Загрузка профиля...' : ''}
        </Text>
      </View>
      {/* Блок создания объявления */}
      <View style={styles.createBlock}>
        <Button title="Создать объявление" onPress={() => setShowCreate(true)} />
      </View>
      {/* Модальное окно создания объявления */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новое объявление</Text>
            <TextInput
              placeholder="Текст объявления"
              value={adText}
              onChangeText={setAdText}
              style={styles.input}
            />
            <TextInput
              placeholder="Номер телефона"
              value={adPhone}
              onChangeText={setAdPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
            <Button title={submitting ? 'Отправка...' : 'Отправить на утверждение'} onPress={handleCreate} disabled={submitting} />
            <Button title="Отмена" onPress={() => setShowCreate(false)} />
          </View>
        </View>
      </Modal>
      {/* Кнопка для показа объявлений на модерацию */}
      <View style={styles.createBlock}>
        <Button title="Объявления на модерацию" onPress={() => setShowModeration(true)} />
      </View>
      {/* Кнопка выхода или входа/регистрации */}
      <View style={{ marginTop: 16 }}>
        {user ? (
          <Button title="Выйти" color="#e53935" onPress={async () => {
            await AsyncStorage.removeItem('token');
            if (setIsAuthenticated) setIsAuthenticated(false);
            if (navigation && navigation.replace) navigation.replace('LoginScreen');
          }} />
        ) : (
          <>
            <Button title="Войти" onPress={() => { setAuthMode('login'); setShowAuthModal(true); }} />
            <View style={{ height: 8 }} />
            <Button title="Зарегистрироваться" onPress={() => { setAuthMode('register'); setShowAuthModal(true); }} />
          </>
        )}
      </View>
      {/* Модальное окно объявлений на модерацию */}
      <Modal visible={showModeration} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Объявления на модерации</Text>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <FlatList
                data={ads}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.adBlock}>
                    <Text style={{ fontWeight: 'bold' }}>{item.text}</Text>
                    <Text>Телефон: {item.phone}</Text>
                    <Text>Отправитель: {item.User?.name || '—'} ({item.User?.email || '—'})</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                        <Text style={{ color: '#fff' }}>Утвердить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                        <Text style={{ color: '#fff' }}>Отменить</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
            <Button title="Закрыть" onPress={() => setShowModeration(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
