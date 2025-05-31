import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useAuthModal } from '../AuthContext';
import { Picker } from '@react-native-picker/picker';

interface ProfileScreenProps {
  setIsAuthenticated?: (v: boolean) => void;
  navigation?: any;
  route?: any;
}

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  address?: string;
  role: string;
}

export default function ProfileScreen({ setIsAuthenticated, navigation, route }: ProfileScreenProps): React.JSX.Element {
  // Common state
  const [showCreate, setShowCreate] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);
    // User and auth state
  const [user, setUser] = useState<ProfileUser | null>(null);
  const { setShowAuthModal, setAuthMode, showAuthModal } = useAuthModal();
  
  // Personal info state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Employee registration state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeRole, setEmployeeRole] = useState('Продавец');
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
  };

  // Получить данные пользователя
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get('/users');
      // Найти пользователя по email из токена
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentUser = res.data.find((u: any) => u.email === tokenPayload.email);
      // Если нет address, подставить пустую строку для корректной работы формы
      setUser(currentUser ? { ...currentUser, address: currentUser.address || '' } : null);
    } catch (e) {
      setUser(null); // сбрасываем user при ошибке
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

  useEffect(() => {
    fetchUser();
    fetchAds();
  }, []);

  // После успешного входа — слушать глобальное окно и обновлять профиль
  useEffect(() => {
    const unsubscribe = () => {};
    // Подписка на закрытие окна авторизации
    if (!showAuthModal) {
      fetchUser();
    }
    return unsubscribe;
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      padding: 16,
    },
    userCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 18,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    menuItem: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#e3f2fd',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuItemText: {
      fontSize: 16,
      color: '#333',
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      color: '#333',
    },
    input: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: '#fff',
    },
    adBlock: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
    },
    approveBtn: {
      backgroundColor: '#4caf50',
      padding: 8,
      borderRadius: 6,
      marginRight: 10,
    },
    rejectBtn: {
      backgroundColor: '#e53935',
      padding: 8,
      borderRadius: 6,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333',
    },
    categoryBlock: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    supplyButtonsContainer: {
      gap: 12,
      marginBottom: 16,
    },
    supplyButton: {
      backgroundColor: '#2196F3',
      marginVertical: 5,
      width: '100%',
    },
    modalView: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '80%',
    },
    button: {
      backgroundColor: '#2196F3',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    buttonSecondary: {
      backgroundColor: '#e0e0e0',
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: 'red',
      marginBottom: 8,
      fontSize: 14,
    },
    closeButton: {
      backgroundColor: '#e0e0e0',
    },
  });

  const renderMenuItem = (icon: string, text: string, onPress: () => void, color: string = '#e3f2fd') => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color }]}>
        <Text>{icon}</Text>
      </View>
      <Text style={styles.menuItemText}>{text}</Text>
    </TouchableOpacity>
  );

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
              setShowSupplyModal(false);
              navigation.navigate('NewSupply');
            }}
          >
            <Text style={styles.buttonText}>Новая</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.supplyButton]}
            onPress={() => {
              setShowSupplyModal(false);
              navigation.navigate('SupplyHistory');
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
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Card */}
      {user && (
        <View style={styles.userCard}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
            {user.name || 'Пользователь'}
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>{user.email}</Text>
        </View>
      )}

      {/* Menu Items */}
      {renderMenuItem('👤', 'Личная информация', () => setShowPersonalInfo(true))}
      {renderMenuItem('📝', 'Создать объявление', () => setShowCreate(true))}      {renderMenuItem('⚖️', 'Объявления на модерацию', () => setShowModeration(true))}
      {renderMenuItem('🛍️', 'Управление товарами', () => navigation.navigate('ProductManagementScreen'))}
      {renderMenuItem('📦', 'Поставки', () => setShowSupplyModal(true))}
      {renderMenuItem('👥', 'Регистрация сотрудника', () => setShowEmployeeRegistration(true))}
      {renderMenuItem('💰', 'Оффлайн-продажи', () => navigation.navigate('OfflineSalesScreen'))}
      
      {/* Auth Button */}
      <View style={{ marginTop: 16 }}>
        {user ? (
          renderMenuItem('🚪', 'Выйти', async () => {
            await AsyncStorage.removeItem('token');
            setUser(null);
            setShowAuthModal(true);
            setAuthMode('login');
            if (setIsAuthenticated) setIsAuthenticated(false);
          }, '#ffebee')
        ) : (
          <>
            {renderMenuItem('🔑', 'Войти', () => {
              setAuthMode('login');
              setShowAuthModal(true);
            })}
            {renderMenuItem('✨', 'Зарегистрироваться', () => {
              setAuthMode('register');
              setShowAuthModal(true);
            })}
          </>
        )}
      </View>

      {/* Personal Info Modal */}
      <Modal visible={showPersonalInfo} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={{ width: '100%' }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Личная информация</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.input}
                  placeholder="Имя"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={true}
                />
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                <TextInput
                  value={editAddress}
                  onChangeText={setEditAddress}
                  style={styles.input}
                  placeholder="Адрес"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  editable={true}
                />
                <Button
                  title={saving ? 'Сохранение...' : 'Сохранить'}
                  onPress={handleSavePersonalInfo}
                  disabled={saving}
                />
                <Button
                  title="Отмена"
                  onPress={() => setShowPersonalInfo(false)}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Employee Registration Modal */}
      <Modal visible={showEmployeeRegistration} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={{ width: '100%' }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Регистрация сотрудника</Text>
                
                {employeeError ? (
                  <Text style={{ color: 'red', marginBottom: 8 }}>{employeeError}</Text>
                ) : null}
                
                <TextInput
                  value={employeeName}
                  onChangeText={setEmployeeName}
                  style={styles.input}
                  placeholder="Имя сотрудника"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={true}
                />
                <TextInput
                  value={employeeEmail}
                  onChangeText={setEmployeeEmail}
                  style={styles.input}
                  placeholder="Email сотрудника"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                <TextInput
                  value={employeePassword}
                  onChangeText={setEmployeePassword}
                  style={styles.input}
                  placeholder="Пароль"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                <View style={styles.input}>
                  <Picker
                    selectedValue={employeeRole}
                    onValueChange={(itemValue) => setEmployeeRole(itemValue)}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Продавец" value="Продавец" />
                    <Picker.Item label="Бухгалтер" value="Бухгалтер" />
                    <Picker.Item label="Грузчик" value="Грузчик" />
                  </Picker>
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    (!employeeName || !employeeEmail || !employeePassword || !employeeRole) && styles.buttonDisabled
                  ]}
                  disabled={!employeeName || !employeeEmail || !employeePassword || !employeeRole}
                  onPress={handleEmployeeRegistration}
                >
                  <Text style={styles.buttonText}>Зарегистрировать</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    setShowEmployeeRegistration(false);
                    setEmployeeName('');
                    setEmployeeEmail('');
                    setEmployeePassword('');
                    setEmployeeError('');
                  }}
                >
                  <Text style={[styles.buttonText, { color: '#666' }]}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Ad Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={{ width: '100%' }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Создать объявление</Text>
                <TextInput
                  value={adText}
                  onChangeText={setAdText}
                  placeholder="Текст объявления"
                  multiline
                  style={styles.input}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  editable={true}
                />
                <TextInput
                  placeholder="Номер телефона"
                  value={adPhone}
                  onChangeText={setAdPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                  autoCorrect={false}
                  editable={true}
                />
                {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
                <Button
                  title={submitting ? 'Отправка...' : 'Отправить на утверждение'}
                  onPress={handleCreate}
                  disabled={submitting}
                />
                <Button
                  title="Отмена"
                  onPress={() => setShowCreate(false)}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Moderation Modal */}      <Modal visible={showModeration} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Объявления на модерацию</Text>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={ads}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }: { item: any }) => (
                  <View style={styles.adBlock}>
                    <Text style={{ fontWeight: 'bold' }}>{item.text}</Text>
                    <Text>Телефон: {item.phone}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(item.id)}
                      >
                        <Text style={{ color: '#fff' }}>Утвердить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(item.id)}
                      >
                        <Text style={{ color: '#fff' }}>Отменить</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
            <Button title="Закрыть" onPress={() => setShowModeration(false)} />
          </View>
        </View>
      </Modal>

      {/* Supply Modal */}
      <SupplyModal />

    </ScrollView>
  );
}
