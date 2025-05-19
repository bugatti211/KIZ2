import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useAuthModal } from '../AuthContext';

interface ProfileScreenProps {
  setIsAuthenticated?: (v: boolean) => void;
  navigation?: any;
  route?: any;
}

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  address?: string;
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
  const [user, setUser] = useState<ProfileUser | null>(null);
  const { setShowAuthModal, setAuthMode, showAuthModal } = useAuthModal();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

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
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get('/users');
      // Найти пользователя по email из токена
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentUser = res.data.find((u: any) => u.email === tokenPayload.email);
      // Если нет address, подставить пустую строку для корректной работы формы
      setUser(currentUser ? { ...currentUser, address: currentUser.address || '' } : null);
    } catch (e) {
      setUser(null); // сбрасываем user при ошибке
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAds();
  }, []);

  // После успешного входа — слушать глобальное окно и обновлять профиль
  useEffect(() => {
    const unsubscribe = () => {};
    // Подписка на закрытие окна авторизации
    if (!showAuthModal) {
      fetchUser();
    }
    return unsubscribe;
  }, [showAuthModal]);

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

  // Функция для обновления личной информации
  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) throw new Error('Нет токена или пользователя');
      await api.put(`/users/${user.id}`, {
        name: editName,
        email: editEmail,
        address: editAddress,
      });
      setUser({ ...user, name: editName, email: editEmail, address: editAddress });
      setShowPersonalInfo(false);
    } catch (e) {
      // Можно добавить обработку ошибок
    } finally {
      setSaving(false);
    }
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

  // При открытии личной информации заполняем поля
  useEffect(() => {
    if (showPersonalInfo && user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditAddress(user.address || '');
    }
  }, [showPersonalInfo, user]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Имя пользователя */}
      {user && user.name ? (
        <View style={{ borderRadius: 12, padding: 18, marginBottom: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'left' }}>{user.name}</Text>
        </View>
      ) : user === null ? (
        <Text style={{ textAlign: 'left' }}>Загрузка профиля...</Text>
      ) : null}
      {/* Кнопка для открытия личной информации */}
      <View style={styles.createBlock}>
        <Button title="Личная информация" onPress={() => setShowPersonalInfo(true)} />
      </View>
      {/* Модальное окно личной информации */}
      <Modal visible={showPersonalInfo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Личная информация</Text>
            <Text style={{ marginBottom: 4 }}>Имя</Text>
            <TextInput value={editName} onChangeText={setEditName} style={styles.input} />
            <Text style={{ marginBottom: 4 }}>Email</Text>
            <TextInput value={editEmail} onChangeText={setEditEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
            <Text style={{ marginBottom: 4 }}>Адрес</Text>
            <TextInput value={editAddress} onChangeText={setEditAddress} style={styles.input} />
            <Button title={saving ? 'Сохранение...' : 'Сохранить'} onPress={handleSavePersonalInfo} disabled={saving} />
            <View style={{ height: 8 }} />
            <Button title="Отмена" onPress={() => setShowPersonalInfo(false)} />
          </View>
        </View>
      </Modal>
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
            setUser(null); // Сбросить пользователя локально
            setShowAuthModal(true); // Открыть глобальное окно авторизации
            setAuthMode('login'); // Переключить на форму входа
            if (setIsAuthenticated) setIsAuthenticated(false);
          }} />
        ) : (
          <>
            <Button title="Войти" onPress={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }} />
            <View style={{ height: 8 }} />
            <Button title="Зарегистрироваться" onPress={() => {
              setAuthMode('register');
              setShowAuthModal(true);
            }} />
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
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }: { item: any }) => (
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
