import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainerRef } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://192.168.0.102:3000'; // Используйте ваш локальный IP

const api = axios.create({
  baseURL: API_URL,
});

// Добавляем токен в каждый запрос, если он есть
api.interceptors.request.use(async (config) => {  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Log token for debugging (remove in production)
      console.log('Token from storage:', token);
      
      try {
        // Try to decode the token first to verify it's valid
        const decoded = jwtDecode(token);
        if (decoded) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
          console.log('Token successfully verified and added to headers');
        }
      } catch (decodeError) {
        console.error('Invalid token in storage:', decodeError);
        await AsyncStorage.removeItem('token');
        if (navigationRef) {
          navigationRef.navigate('LoginScreen');
        }
      }
    }
    return config;
  } catch (error) {
    console.error('Error processing token:', error);
    return config;
  }
});

let navigationRef: NavigationContainerRef<any> | null = null;
export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

// Глобальный перехватчик ошибок для автоматического logout при истечении токена
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      if (navigationRef) {
        navigationRef.navigate('LoginScreen');
      }
    }
    return Promise.reject(error);
  }
);

// Cart API endpoints
export const cartApi = {
  // Получить содержимое корзины
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 401) {
        // Игнорируем ошибку 401
        return null;
      }
      throw error;
    }
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

export const chatApi = {
  getMessagesWithSeller: async (sellerId: number) => {
    const res = await api.get(`/chats/${sellerId}/messages`);
    return res.data;
  },
  sendMessageToSeller: async (sellerId: number, text: string) => {
    const res = await api.post(`/chats/${sellerId}/messages`, { text });
    return res.data;
  },
  getSellerChats: async () => {
    const res = await api.get('/seller-chats');
    return res.data;
  },
  getMessagesWithUser: async (userId: number) => {
    const res = await api.get(`/seller-chats/${userId}`);
    return res.data;
  },
  sendMessageToUser: async (userId: number, text: string) => {
    const res = await api.post(`/seller-chats/${userId}`, { text });
    return res.data;
  }
};

export default api;
