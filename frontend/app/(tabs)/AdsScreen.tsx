import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, TextInput, Button, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegisterScreen from '../RegisterScreen';
import api from '../api';
import { useIsFocused } from '@react-navigation/native';

function CustomLogin({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { login } = require('../authApi');
      const data = await login(email, password);
      await AsyncStorage.setItem('token', data.token);
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <Text style={{ fontSize: 20, marginBottom: 16, textAlign: 'center' }}>Вход в аккаунт</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8, fontSize: 16, width: '100%' }}
      />
      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 16, padding: 10, borderRadius: 8, fontSize: 16, width: '100%' }}
      />
      {!!error && <Text style={{ color: 'red', marginBottom: 8, textAlign: 'center' }}>{error}</Text>}
      <Button title={loading ? 'Вход...' : 'Войти'} onPress={handleLogin} disabled={loading} />
      <TouchableOpacity onPress={onSwitch} style={{ marginTop: 14, alignItems: 'center' }}>
        <Text style={{ color: '#007AFF', fontSize: 16 }}>Нет аккаунта? Зарегистрироваться</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdsScreen() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isFocused = useIsFocused();

  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ads');
      setAds(res.data);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки объявлений');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) setShowAuth(true);
      setIsAuthChecked(true);
    })();
  }, []);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (isFocused) fetchAds();
  }, [isFocused]);

  if (!isAuthChecked) return null;

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f7f7f7' }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.adCard}>
              <View style={styles.adHeader}>
                <Text style={styles.adTitle}>{item.text}</Text>
              </View>
              <View style={styles.adInfoRow}>
                <Text style={styles.adLabel}>Телефон:</Text>
                <Text style={styles.adValue}>{item.phone}</Text>
              </View>
              <View style={styles.adInfoRow}>
                <Text style={styles.adLabel}>Отправитель:</Text>
                <Text style={styles.adValue}>{item.User?.name || '—'}</Text>
              </View>
            </View>
          )}
        />
      )}
      <Modal visible={showAuth} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</Text>
              <Pressable onPress={() => setShowAuth(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            {authMode === 'login' ? (
              <CustomLogin onSuccess={() => setShowAuth(false)} onSwitch={() => setAuthMode('register')} />
            ) : (
              <>
                <RegisterScreen navigation={{ replace: () => setAuthMode('login'), navigate: () => setAuthMode('login') }} />
                <TouchableOpacity onPress={() => setAuthMode('login')} style={styles.switchLink}>
                  <Text style={styles.switchLinkText}>Уже есть аккаунт? Войти</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#888',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  switchLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchLinkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  adCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adHeader: {
    marginBottom: 10,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  adInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  adLabel: {
    fontWeight: '600',
    color: '#888',
    marginRight: 6,
  },
  adValue: {
    color: '#333',
    fontWeight: '500',
  },
});
