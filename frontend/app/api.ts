import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainerRef } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from './config/env';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to each request if it exists
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (decoded.exp && decoded.exp < currentTime) {
          await AsyncStorage.removeItem('token');
          if (navigationRef) {
            navigationRef.navigate('(auth)/login');
          }
          throw new Error('Token expired');
        }

        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } catch (decodeError) {
        console.error('Invalid token:', decodeError);
        await AsyncStorage.removeItem('token');
        if (navigationRef) {
          navigationRef.navigate('(auth)/login');
        }
      }
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
});

let navigationRef: NavigationContainerRef<any> | null = null;
export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

// Global error interceptor for automatic logout on token expiration
api.interceptors.response.use(
  response => response,
  async error => {
    if (error?.response?.status === 401) {
      console.log('Unauthorized request, clearing token');
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
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      const res = await api.get(`/chats/${sellerId}/messages`);
      return res.data;
    } catch (error: any) {
      console.error('Error getting messages with seller:', error);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
      }
      throw error;
    }
  },
  sendMessageToSeller: async (sellerId: number, text: string) => {
    try {
      const res = await api.post(`/chats/${sellerId}/messages`, { text });
      return res.data;
    } catch (error) {
      console.error('Error sending message to seller:', error);
      throw error;
    }
  },  getSellerChats: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      const res = await api.get('/seller-chats');
      return res.data;
    } catch (error: any) {
      console.error('Error getting seller chats:', error);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
      }
      throw error;
    }
  },  getMessagesWithUser: async (userId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      const res = await api.get(`/seller-chats/${userId}/messages`);
      return res.data;
    } catch (error: any) {
      console.error('Error getting messages with user:', error);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
      }
      throw error;
    }
  },  sendMessageToUser: async (userId: number, text: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      const res = await api.post(`/seller-chats/${userId}/messages`, { text });
      return res.data;
    } catch (error: any) {
      console.error('Error sending message to user:', error);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
      }
      throw error;
    }
  }
};

export default api;
