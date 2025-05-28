import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

export default function CategoryProductsScreen() {
  const route = useRoute();
  // @ts-ignore
  const { category, categoryId } = route.params || {};
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Set up header back button without label
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton
          onPress={() => navigation.goBack()}
          label=""
        />
      ),
    });
  }, [navigation]);

  // Fetch products when screen is focused or categoryId changes
  useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused, categoryId]);

  // Filter products when search query or products change
  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      const filteredProducts = res.data
        .filter((p: any) => p.categoryId === categoryId && p.active === true)
        .map((p: any) => ({
          ...p,
          stock: Number(p.stock),
          category: p.category || { id: categoryId, name: category }
        }));
      setProducts(filteredProducts);
      setFilteredProducts(filteredProducts);
    } catch (e) {
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const openProductCard = (product: any) => {
    // @ts-ignore
    navigation.navigate('ProductCardScreen', { product });
  };

  // Проверка наличия параметров
  if (!category || !categoryId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>Ошибка: параметры категории не переданы.</Text>
      </View>
    );
  }

  const sortProducts = () => {
    if (!filteredProducts.length) return;
    
    let newSortOrder: 'asc' | 'desc' | null;
    if (!sortOrder) newSortOrder = 'asc';
    else if (sortOrder === 'asc') newSortOrder = 'desc';
    else newSortOrder = null;
    
    setSortOrder(newSortOrder);
    
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (!newSortOrder) return products.findIndex(p => p.id === a.id) - products.findIndex(p => p.id === b.id);
      return newSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });
    
    setFilteredProducts(sortedProducts);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
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

      <TouchableOpacity 
        style={styles.sortButton} 
        onPress={sortProducts}
      >
        <Text style={styles.sortButtonText}>
          {sortOrder === 'asc' ? '↑ По возрастанию цены' : 
           sortOrder === 'desc' ? '↓ По убыванию цены' : 
           '⇅ Сортировать по цене'}
        </Text>
      </TouchableOpacity>
      
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openProductCard(item)}>
              <View style={styles.productBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Иконка слева */}
                  <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 28 }}>🛒</Text>
                  </View>
                  {/* Контент справа от иконки */}
                  <View style={{ flex: 1 }}>
                    {/* Название в одну строку с ... */}
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    {/* Индикатор и кнопка под названием */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ fontSize: 18, color: item.stock > 0 ? '#388e3c' : '#d11a2a', fontWeight: 'bold', marginRight: 8 }}>
                        {item.stock > 0 ? '●' : '×'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#888', marginRight: 12 }}>
                        {item.stock > 0 
                          ? `В наличии: ${item.category?.name === 'На развес' ? item.stock.toFixed(2) : item.stock} ${item.category?.name === 'На развес' ? 'кг' : 'шт.'}`
                          : 'Нет в наличии'}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.priceButton, { backgroundColor: item.stock > 0 ? '#4caf50' : '#ccc' }]} 
                        disabled={item.stock <= 0}
                        onPress={() => openProductCard(item)}
                      >
                        <Text style={styles.priceText}>{item.price.toLocaleString()} ₽</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#888' }}>
              {searchQuery ? 'Товары не найдены' : 'Нет товаров'}
            </Text>
          }
          style={{ marginBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  productBlock: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sortButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  priceButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 'auto',
  },
  priceText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
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
  }
});
