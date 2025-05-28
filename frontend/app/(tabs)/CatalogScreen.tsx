import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Описываем параметры навигации для Stack
export type RootStackParamList = {
  CategoryProductsScreen: { category: string; categoryId: number };
  ProductCardScreen: { product: any };
};

export default function CatalogScreen() {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Загрузка категорий и продуктов из backend
  useEffect(() => {
    fetchCategoriesAndProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(product =>      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const fetchCategoriesAndProducts = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);
      setCategories(categoriesRes.data);
      const activeProducts = productsRes.data.filter((p: any) => p.active === true);
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
    } catch (e) {
      // обработка ошибок
    }
  };

  // Добавление категории через backend
  const handleAddCategory = async () => {
    setSaving(true);
    try {
      await api.post('/categories', { name: categoryName });
      setCategoryName('');
      setShowAddCategory(false);
      await fetchCategoriesAndProducts(); // всегда обновлять список после добавления
    } catch (e) {
      // обработка ошибок
    } finally {
      setSaving(false);
    }
  };

  // Удаление категории через backend
  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategoriesAndProducts(); // всегда обновлять список после удаления
    } catch (e) {
      // обработка ошибок
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Заголовок убран, чтобы не дублировать с навигацией */}
      <Button title="Добавить категорию" onPress={() => setShowAddCategory(true)} />
        <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={searchQuery ? filteredProducts : categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          if (searchQuery) {
            // Отображение товара в результатах поиска
            return (
              <TouchableOpacity onPress={() => navigation.navigate('ProductCardScreen', { product: item })}>
                <View style={[styles.categoryBlock, { flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ color: item.stock > 0 ? '#388e3c' : '#d11a2a', marginRight: 8 }}>
                        {item.stock > 0 ? '● В наличии' : '× Нет в наличии'}
                      </Text>
                      <Text style={{ fontWeight: 'bold' }}>{item.price.toLocaleString()} ₽</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </View>
              </TouchableOpacity>
            );
          }
          
          // Отображение категории, когда нет поиска
          return (
            <View style={styles.categoryBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('CategoryProductsScreen', {
                      category: item.name,
                      categoryId: item.id,
                    });
                  }}
                  style={{ flex: 1 }}
                >
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} accessibilityLabel="Удалить категорию">
                  <Ionicons name="trash-outline" size={22} color="#d11a2a" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>
            {searchQuery ? 'Товары не найдены' : 'Нет категорий'}
          </Text>
        }
        style={{ marginTop: 24 }}
      />
      <Modal visible={showAddCategory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новая категория</Text>
            <TextInput
              placeholder="Название категории"
              value={categoryName}
              onChangeText={setCategoryName}
              style={styles.input}
            />
            <Button title={saving ? 'Добавление...' : 'Добавить'} onPress={handleAddCategory} disabled={saving || !categoryName.trim()} />
            <View style={{ height: 8 }} />
            <Button title="Отмена" onPress={() => setShowAddCategory(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
  },
  categoryBlock: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  categoryText: {
    fontSize: 18,
    color: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
