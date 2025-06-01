import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, Modal, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useAuthModal } from '../AuthContext';
import { styles } from '../styles/ProfileScreenStyles';
import { useRouter } from 'expo-router';
import { authEvents, AUTH_EVENTS } from '../events';
import { decodeToken } from '../utils/tokenUtils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../types/navigation';

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  address?: string;
  role: string;
}

interface ProfileScreenProps {
  setIsAuthenticated?: (v: boolean) => void;
  navigation?: any;
  route?: any;
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen({ setIsAuthenticated, navigation, route }: ProfileScreenProps): React.JSX.Element {
  const router = useRouter();
  const navigationNative = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { showAuthModal, setShowAuthModal, setAuthMode } = useAuthModal();

  // Common state management
  const [showCreate, setShowCreate] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);

  // Personal info state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
    // Employee registration state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  
  // Ad state
  const [adText, setAdText] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- ТОВАРЫ ---
  // Тип товара
  type Product = {
    id: number;
    name: string;
    categoryId: number;
    description: string;
    recommendations: string;
    price: number;
    stock: number;
    active: boolean;
  };

  // Состояния для товаров
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Форма товара
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState<number | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [productRecommendations, setProductRecommendations] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('0');
  const [productActive, setProductActive] = useState(true);

  // Получить категории для выпадающего списка
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {}
  };

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
  };  // Получить данные пользователя
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        console.error('Invalid or expired token');
        setUser(null);
        await AsyncStorage.removeItem('token');
        return;
      }

      const res = await api.get('/users');
      const currentUser = res.data.find((u: ProfileUser) => u.email === decodedToken.email);
      
      if (currentUser) {
        setUser({ ...currentUser, address: currentUser.address || '' });
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching user:', e);
      setUser(null);
      await AsyncStorage.removeItem('token');
    }
  };

  // Получить товары пользователя
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) return;
      const res = await api.get('/products');
      // Фильтруем только свои товары
      setProducts(res.data.filter((p: any) => p.userId === user.id));
    } catch {}
  };
  // Initialize profile with proper loading states
  useEffect(() => {
    const initializeProfile = async () => {
      if (!isInitialLoad) return;

      setIsLoading(true);
      try {
        await Promise.all([
          fetchUser(),
          fetchAds()
        ]);
      } catch (error) {
        console.error('Error initializing profile:', error);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    initializeProfile();
  }, [isInitialLoad]);

  // После успешного входа — слушать глобальное окно и обновлять профиль
  useEffect(() => {
    if (!showAuthModal && !isInitialLoad) {
      setIsLoading(true);
      fetchUser().finally(() => setIsLoading(false));
    }
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

  // Новый функционал: товары пользователя
  // (удаляем дублирующее объявление состояний и категорий ниже)

  // Открыть модалку для добавления товара
  const openAddProduct = async () => {
    await fetchCategories(); // обновить список категорий перед открытием модалки
    setEditProduct(null);
    setProductName('');
    setProductCategory(categories[0]?.id ?? null);
    setProductDescription('');
    setProductRecommendations('');
    setProductPrice('');
    setProductStock('0');
    setProductActive(true);
    setShowProductModal(true);
  };

  // Открыть модалку для редактирования товара
  const openEditProduct = async (product: Product) => {
    await fetchCategories(); // обновить список категорий перед открытием модалки
    setEditProduct(product);
    setProductName(product.name);
    setProductCategory(product.categoryId);
    setProductDescription(product.description);
    setProductRecommendations(product.recommendations);
    setProductPrice(product.price.toString());
    setProductStock(product.stock.toString());
    setProductActive(product.active);
    setShowProductModal(true);
  };

  // Добавить или сохранить товар через backend
  const handleSaveProduct = async () => {
    if (!productName.trim() || !productCategory || !productPrice.trim()) {
      alert('Пожалуйста, заполните все обязательные поля: название, категория, цена.');
      return;
    }
    const productData = {
      name: productName,
      categoryId: productCategory,
      description: productDescription,
      recommendations: productRecommendations,
      price: Number(productPrice),
      stock: Number(productStock),
      active: productActive,
      userId: user?.id,
    };
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения товара');
    }
  };

  const renderMenuItem = (icon: string, title: string, onPress: () => void, backgroundColor?: string) => {
    // Для неавторизованных пользователей скрываем все пункты меню
    if (!user) {
      return null;
    }
    
    // Проверяем права доступа на основе роли пользователя
    if (user) {
      // Только для админа
      if (title === 'Регистрация сотрудника' && user.role !== 'admin') {
        return null;
      }
      
      // Только для админа
      if (title === 'Объявления на модерацию' && user.role !== 'admin') {
        return null;
      }
      
      // Только для админа и продавцов
      if ((title === 'Управление товарами' || title === 'Поставки' || title === 'Оффлайн-продажи') 
          && user.role !== 'admin' && user.role !== 'Продавец') {
        return null;
      }
    }

    return (
      <TouchableOpacity 
        style={[styles.menuItem, backgroundColor ? { backgroundColor } : null]} 
        onPress={onPress}
      >
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  // При открытии личной информации заполняем поля
  useEffect(() => {
    if (showPersonalInfo && user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditAddress(user.address || '');
    }
  }, [showPersonalInfo, user]);

  const SupplyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSupplyModal}
      onRequestClose={() => setShowSupplyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Поставки</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.supplyButton]}
            onPress={() => {
              setShowSupplyModal(false);              navigationNative.navigate('NewSupply');
            }}
          >
            <Text style={styles.buttonText}>Новая</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.supplyButton]}
            onPress={() => {
              setShowSupplyModal(false);
              navigationNative.navigate('SupplyHistory');
            }}
          >
            <Text style={styles.buttonText}>История</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => setShowSupplyModal(false)}
          >
            <Text style={styles.buttonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Функция для регистрации сотрудника
  const handleEmployeeRegistration = async () => {
    setEmployeeError('');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
      setEmployeeError('Пожалуйста, введите корректный email адрес');
      return;
    }    // Validate password length
    if (employeePassword.length < 6) {
      setEmployeeError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');
      
      await api.post('/users/register-employee', {
        name: employeeName,
        email: employeeEmail,
        password: employeePassword,
        role: employeeRole
      });
      
      // Очистить форму и закрыть модальное окно
      setShowEmployeeRegistration(false);
      setEmployeeName('');
      setEmployeeEmail('');
      setEmployeePassword('');
    } catch (e: any) {
      setEmployeeError(e.message || 'Ошибка при регистрации сотрудника');
    }
  };  const handleLogout = async () => {
    try {
      // Remove token first to prevent race conditions
      await AsyncStorage.removeItem('token');
      
      // Reset user state
      setUser(null);
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      
      // Emit token change event to update all components that depend on auth status
      authEvents.emit(AUTH_EVENTS.TOKEN_CHANGE);
      
      // Navigate using replace to prevent back navigation after logout
      router.replace({
        pathname: "/(tabs)/AdsScreen"
      });
    } catch (e) {
      console.error('Error during logout:', e);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };
  return (
    <ScrollView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <>
          {/* Модальное окно редактирования личных данных */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showPersonalInfo}
            onRequestClose={() => setShowPersonalInfo(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Личные данные</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Имя"
                  value={editName}
                  onChangeText={setEditName}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Адрес"
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSavePersonalInfo}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Сохранить</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.closeButton]}
                    onPress={() => setShowPersonalInfo(false)}
                  >
                    <Text style={styles.buttonText}>Отмена</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>          {/* Модальное окно поставок */}
          <SupplyModal />

          {user ? (
            <>
              {/* Профиль пользователя */}
              <View style={styles.profileContainer}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.role}>{user.role}</Text>
              </View>
              {/* Меню действий */}
              <View style={styles.menuContainer}>
                {renderMenuItem('👤', 'Личные данные', () => setShowPersonalInfo(true))}
                {renderMenuItem('🛍️', 'Мои заказы', () => router.push('/(tabs)/OrdersScreen'))}                {renderMenuItem('📦', 'Управление товарами', () => navigationNative.navigate('ProductManagementScreen'))}
                {renderMenuItem('📋', 'Поставки', () => setShowSupplyModal(true))}
                {renderMenuItem('💰', 'Оффлайн-продажи', () => navigationNative.navigate('OfflineSalesScreen'))}
                {renderMenuItem('⚖️', 'Объявления на модерацию', () => router.push('/(tabs)/AdsScreen'))}
                {renderMenuItem('👥', 'Регистрация сотрудника', () => router.push('/(auth)/register'))}
                {renderMenuItem('🚪', 'Выйти', handleLogout, '#FFE5E5')}
              </View>
            </>
          ) : (
            // Контент для неавторизованных пользователей
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Добро пожаловать! Войдите или зарегистрируйтесь, чтобы получить доступ к личному кабинету.
              </Text>          <TouchableOpacity 
                style={[styles.authButton, { backgroundColor: '#4A90E2' }]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.authButtonText}>Войти</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.authButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.authButtonText}>Зарегистрироваться</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
