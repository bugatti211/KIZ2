import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://192.168.0.103:3000'; // Используйте ваш локальный IP

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

// Cart API endpoints
export const cartApi = {
  // Получить содержимое корзины
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Добавить товар в корзину
  addToCart: async (productId: number, quantity: number) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },

  // Обновить количество товара в корзине
  updateCartItem: async (productId: number, quantity: number) => {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },

  // Удалить товар из корзины
  removeFromCart: async (productId: number) => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  },

  // Очистить корзину
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
};

// Order API endpoints
export const orderApi = {
  // Получить заказы пользователя
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Создать новый заказ
  createOrder: async (orderData: {
    userId: number;
    name: string;
    email: string;
    address?: string;
    deliveryMethod: 'Самовывоз' | 'Доставка';
    paymentMethod: 'картой' | 'наличные';
    comment?: string;
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    total: number;
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  }
};

export default api;
