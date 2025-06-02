import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ad, ApiError } from '../types/ad.types';
import api from '../api';
import { Alert } from 'react-native';

export const useAds = (isAdmin: boolean, isAuthenticated: boolean) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isAdmin ? '/ads/moderation' : '/ads';
      const response = await api.get(endpoint);
      const responseData = response.data as Ad[];
      
      const filteredAds = responseData.filter(ad => {
        if (ad.deleted) return false;
        
        if (!isAuthenticated) {
          return ad.status === 'approved';
        } else if (isAdmin) {
          return ad.status !== 'rejected';
        } else {
          return ad.status === 'approved';
        }
      });
      
      const sortedAds = filteredAds.sort((a, b) => {
        if (isAdmin && a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
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

  return {
    ads,
    loading,
    error,
    fetchAds,
    handleApprove,
    handleReject,
    handleDelete
  };
};

export const useAuth = () => {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuth = async () => {
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
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthChecked,
    isAuthenticated,
    isAdmin
  };
};
