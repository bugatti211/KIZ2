import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://192.168.0.107:3000'; // Используйте ваш локальный IP

const api = axios.create({
  baseURL: API_URL,
});

// Добавляем токен в каждый запрос, если он есть
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Глобальный перехватчик ошибок для автоматического logout при истечении токена
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      // Можно показать алерт или уведомление
      Alert.alert('Сессия истекла', 'Пожалуйста, войдите в аккаунт заново.');
      // Можно добавить логику для глобального logout через событие или callback
    }
    return Promise.reject(error);
  }
);

export default api;
