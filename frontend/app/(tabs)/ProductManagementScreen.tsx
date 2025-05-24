import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api';
import { Product } from '../models/product.model';

type RootStackParamList = {
  AddEditProductScreen: { product?: Product };
  ProfileMain: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#444',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    fontSize: 16,
  },
});

export default function ProductManagementScreen() {
  const isFocused = useIsFocused();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const navigation = useNavigation<NavigationProp>();

  // Set up header back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props: HeaderBackButtonProps) => (
        <HeaderBackButton
          {...props}
          onPress={() => navigation.goBack()}
          label=""
        />
      )
    });
  }, [navigation]);

  // Fetch data when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleProductActive = async (productId: number, currentActive: boolean) => {
    Alert.alert(
      'Подтверждение',
      `Вы уверены, что хотите ${currentActive ? 'скрыть' : 'показать'} этот товар?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: currentActive ? 'Скрыть' : 'Показать',
          onPress: async () => {
            try {
              const newActive = !currentActive;
              await api.patch(`/products/${productId}`, { active: newActive });
              
              // Обновляем состояние локально
              setProducts(products.map((p: Product) => 
                p.id === productId ? { ...p, active: newActive } : p
              ));
            } catch (e: any) {
              console.error('Ошибка обновления статуса:', e);
              Alert.alert(
                'Ошибка', 
                'Не удалось обновить статус товара. Попробуйте позже.'
              );
            }
          }
        }
      ]
    );
  };
  const handleEditProduct = (product: Product) => {
    navigation.navigate('AddEditProductScreen', { product });
  };

  const handleDeleteProduct = async (productId: number) => {
    Alert.alert(
      'Подтверждение',
      'Вы уверены, что хотите удалить этот товар?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${productId}`);
              setProducts(products.filter((p: Product) => p.id !== productId));
            } catch (e) {
              Alert.alert('Ошибка', 'Не удалось удалить товар');
            }
          }
        }
      ]
    );
  };

  const handleAddProduct = () => {
    navigation.navigate('AddEditProductScreen', {});
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: { id: number; name: string }) => c.id === categoryId);
    return category ? category.name : 'Неизвестная категория';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Добавить товар</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory} numberOfLines={1}>
                Категория: {getCategoryName(item.categoryId)}
              </Text>
              <Text style={styles.productPrice}>
                {item.price} ₽ • {item.stock > 0 ? `${item.stock} шт.` : 'Нет в наличии'}
              </Text>
            </View>
            
            <View style={styles.controls}>
              <Switch
                value={item.active}
                onValueChange={() => toggleProductActive(item.id, item.active)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={item.active ? '#2196F3' : '#f4f3f4'}
              />
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditProduct(item)}
              >
                <Ionicons name="pencil" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteProduct(item.id)}
              >
                <Ionicons name="trash" size={20} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет товаров</Text>
        }
      />
    </View>
  );
}
