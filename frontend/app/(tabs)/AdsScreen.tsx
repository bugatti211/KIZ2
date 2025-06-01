import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdsScreen() {  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthChecked, setIsAuthChecked] = useState(false);  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isFocused = useIsFocused();
  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isAdmin ? '/ads/moderation' : '/ads';
      const res = await api.get(endpoint);
      setAds(res.data);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки объявлений');
    } finally {
      setLoading(false);
    }
  };  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(tokenData.role === 'admin');
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
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
  const handleCreateAd = () => {
    router.push('/(auth)/login');
    setShowAuth(false);
  };

  const handleApprove = async (adId: number) => {
    try {
      await api.post(`/ads/${adId}/approve`);
      fetchAds();
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось подтвердить объявление');
    }
  };

  const handleReject = async (adId: number) => {
    try {
      await api.post(`/ads/${adId}/reject`);
      fetchAds();
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось отклонить объявление');
    }
  };

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
              <Text style={styles.adText}>{item.text}</Text>
              <Text style={styles.adPhone}>{item.phone}</Text>
              {isAdmin && item.status === 'pending' && (
                <View style={styles.moderationButtons}>
                  <TouchableOpacity
                    style={[styles.moderationButton, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                  >
                    <Text style={styles.buttonText}>Подтвердить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moderationButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Text style={styles.buttonText}>Отклонить</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!isAdmin && item.status === 'approved' && (
                <Text style={styles.statusText}>Подтверждено</Text>
              )}
            </View>
          )}        />
      )}      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          if (!isAuthenticated) {
            setShowAuth(true);
          } else {
            router.push('/create-ad');
          }
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAuth} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</Text>
              <Pressable onPress={() => setShowAuth(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>              <TouchableOpacity 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  adText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  adPhone: {
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  moderationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  moderationButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusText: {
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: '600',
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
