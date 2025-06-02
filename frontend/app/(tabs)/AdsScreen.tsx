import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '../styles/AdsScreenStyles';

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
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isFocused = useIsFocused();

  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {      const endpoint = isAdmin ? '/ads/moderation' : '/ads';
      const response = await api.get(endpoint);
      const responseData = response.data as Ad[];
        // Filter ads based on status and authorization
      const filteredAds = responseData.filter(ad => {
        // Remove deleted ads for everyone
        if (ad.deleted) return false;
        
        if (!isAuthenticated) {
          // For unauthorized users: show only approved ads
          return ad.status === 'approved';
        } else if (isAdmin) {
          // For admins: show pending and approved ads
          return ad.status !== 'rejected';
        } else {
          // For authorized non-admin users: show only approved ads
          return ad.status === 'approved';
        }
      });
        const sortedAds = filteredAds.sort((a, b) => {
        if (isAdmin && a.status !== b.status) {
          // For admin, show pending first, then approved
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
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(tokenData.role === 'admin');
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
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
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.adCard}>
              <Text style={styles.adText}>{item.text}</Text>
              <Text style={styles.adPhone}>{item.phone}</Text>
              {isAdmin && (
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
                    <View style={styles.statusContainer}>                      <Text style={styles.statusText}>Подтверждено</Text>
                      {(
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
