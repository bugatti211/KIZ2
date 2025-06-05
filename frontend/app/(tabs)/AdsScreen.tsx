import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserRole } from '../../constants/Roles';
import { decodeToken } from '../utils/tokenUtils';

type AdStatus = 'pending' | 'approved' | 'rejected';

interface Ad {
  id: number;
  text: string;
  phone: string;
  status: AdStatus;
  deleted: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function AdsScreen() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isFocused = useIsFocused();

  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = '/ads';
      const response = await api.get(endpoint);
      const responseData = response.data as Ad[];

      const filteredAds = responseData.filter(ad => {
        // Remove deleted ads for everyone
        if (ad.deleted) return false;
        
        if (!isAuthenticated) {
          // For unauthorized users: show only approved ads
          return ad.status === 'approved';
        } else if (isAdmin || isLoader) {
          // For admins and loaders: show pending and approved ads
          return ad.status !== 'rejected';
        } else {
          // For other authorized users: show only approved ads
          return ad.status === 'approved';
        }
      });

      const sortedAds = filteredAds.sort((a, b) => {
        if ((isAdmin || isLoader) && a.status !== b.status) {
          // For admin and loaders, show pending first, then approved
          return a.status === 'pending' ? -1 : 1;
        }
        // Sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setAds(sortedAds);
    } catch (e) {
      const error = e as ApiError;
      setError(error.response?.data?.error || 'Ошибка загрузки объявлений');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId: number) => {
    try {
      await api.post(`/ads/${adId}/approve`);
      await fetchAds();
    } catch (e) {
      const error = e as ApiError;
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось подтвердить объявление');
    }
  };

  const handleReject = async (adId: number) => {
    try {
      await api.post(`/ads/${adId}/reject`);
      await fetchAds();
    } catch (e) {
      const error = e as ApiError;
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось отклонить объявление');
    }
  };

  const handleDelete = async (adId: number) => {
    Alert.alert(
      'Подтверждение',
      'Вы действительно хотите удалить это объявление?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/ads/${adId}`);
              await fetchAds();
            } catch (e) {
              const error = e as ApiError;
              Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось удалить объявление');
            }
          }
        }
      ]
    );
  };
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        const tokenData = decodeToken(token);
        if (tokenData) {
          setIsAdmin(tokenData.role === UserRole.ADMIN);
          setIsLoader(tokenData.role === UserRole.LOADER);
          setIsStaff([
            UserRole.ADMIN,
            UserRole.SELLER,
            UserRole.ACCOUNTANT,
            UserRole.LOADER,
          ].includes(tokenData.role));
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoader(false);
        setIsStaff(false);
      }
      setIsAuthChecked(true);
    })();
  }, []);

  // Fetch ads when admin status changes or screen is focused
  useEffect(() => {
    if (isAuthChecked) {
      fetchAds();
    }
  }, [isAdmin, isAuthChecked, isFocused]);

  if (!isAuthChecked) return null;

  const handleCreateAd = () => {
    router.push('/(auth)/login');
    setShowAuth(false);
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
              <Text style={styles.adPhone}>{item.phone}</Text>              {(isAdmin || isLoader) && (
                <View style={styles.moderationButtons}>
                  {item.status === 'pending' ? (
                    <>
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
                    </>
                  ) : (
                    <View style={styles.statusContainer}>                      
                      <Text style={styles.statusText}>Подтверждено</Text>
                      {isAdmin && (
                        <TouchableOpacity
                          style={[styles.moderationButton, styles.deleteButton]}
                          onPress={() => handleDelete(item.id)}
                        >
                          <Text style={styles.buttonText}>Удалить</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
              {!isAdmin && item.status === 'approved' && (
                <Text style={styles.statusText}>Подтверждено</Text>
              )}
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      {!isStaff && (
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
      )}

      <Modal visible={showAuth} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              </Text>
              <Pressable onPress={() => setShowAuth(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
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
    marginBottom: 10,
    width: '100%',
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
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
