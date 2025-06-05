import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CatalogContent from '../../components/CatalogContent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import api from '../api';
import { UserRole } from '../../constants/Roles';
import { decodeToken } from '../utils/tokenUtils';

type CatalogScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Category {
  id: string;
  name: string;
}

export default function CatalogScreen() {
  const router = useRouter();
  const navigation = useNavigation<CatalogScreenNavigationProp>();
  const [isAdmin, setIsAdmin] = useState(false);  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    price: number;
    active: boolean;
  }>>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {        const tokenData = decodeToken(token);
        if (!tokenData) {
          throw new Error('Invalid token data');
        }
        setIsAdmin(tokenData.role === UserRole.ADMIN);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, []);
  const fetchCategories = async () => {
    setLoading(true);
    try {
      setError('');      const response = await api.get('/categories');
      const token = await AsyncStorage.getItem('token');
      let filteredCategories = response.data;
      
      // Фильтруем категорию "Поставки новые" для неавторизованных и обычных пользователей
      if (!token || !isAdmin) {
        filteredCategories = response.data.filter((category: Category) => 
          category.name.toLowerCase() !== 'поставки новые'
        );
      }
      
      setCategories(filteredCategories);
    } catch (err: any) {
      console.error('Ошибка загрузки категорий:', err);
      setError('Не удалось загрузить категории. Проверьте подключение к интернету или попробуйте позже.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setIsSearching(false);
      setFilteredCategories(categories);
      return;
    }
    setIsSearching(true);
    const query = text.toLowerCase().trim();
    const matchingProducts = products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description?.toLowerCase().includes(query)
    );
    setFilteredProducts(matchingProducts);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setError('');
      await api.delete(`/categories/${selectedCategoryId}`);
      await fetchCategories();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка при удалении категории';
      setError(errorMessage);
      if (err.response?.status === 403) {
        Alert.alert('Ошибка доступа', errorMessage);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      setError('Введите название категории');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.post('/categories', { name: categoryName.trim() });
      await fetchCategories();
      setCategoryName('');
      setShowAddCategory(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка при добавлении категории';
      setError(errorMessage);
      if (err.response?.status === 403) {
        Alert.alert('Ошибка доступа', errorMessage);
        setShowAddCategory(false);
      }
    } finally {
      setSaving(false);
    }
  };
  const handleCategoryPress = (categoryId: string, category: string): void => {
    navigation.navigate('CategoryProductsScreen', { categoryId, category });
  };
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.filter((p: any) => p.active));
    } catch (err: any) {
      console.error('Ошибка загрузки товаров:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([checkAdminStatus(), fetchCategories(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, [checkAdminStatus]);

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Text style={styles.dismissError}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>      <ScrollView>
        {isSearching ? (
          // Показываем результаты поиска товаров
          filteredProducts.length === 0 ? (
            <Text style={styles.emptyText}>Товары не найдены</Text>
          ) : (
            filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productBlock}
                onPress={() => navigation.navigate('ProductCardScreen', { product })}
              >
                <View style={styles.productContent}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.categoryLabel}>
                    {categories.find(c => c.id === product.categoryId)?.name || ''}
                  </Text>
                  {product.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  )}
                  <Text style={styles.productPrice}>{product.price} ₽</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          // Показываем список категорий
          filteredCategories.length === 0 && !error ? (
            <Text style={styles.emptyText}>Нет доступных категорий</Text>
          ) : (
            filteredCategories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryBlock}
                onPress={() => navigation.navigate('CategoryProductsScreen', {
                  categoryId: category.id,
                  category: category.name
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.categoryText}>{category.name}</Text>
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddCategory(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Подтверждение удаления</Text>
            <Text style={styles.modalText}>
              Вы уверены, что хотите удалить эту категорию? Это действие нельзя отменить.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.buttonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategory}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить категорию</Text>
            <TextInput
              style={styles.input}
              placeholder="Название категории"
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddCategory(false);
                  setCategoryName('');
                  setError('');
                }}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#2196f3' }]}
                onPress={handleAddCategory}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Добавление...' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  dismissError: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categoryBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2196f3',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  productBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
});
