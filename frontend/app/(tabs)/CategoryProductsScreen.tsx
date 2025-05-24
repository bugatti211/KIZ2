import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import api from '../api';

export default function CategoryProductsScreen() {
  const route = useRoute();
  // @ts-ignore
  const { category, categoryId } = route.params || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [isFocused, categoryId]);const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      // Фильтруем по категории и активности, убедившись что товар активен
      const filteredProducts = res.data.filter((p: any) => 
        p.categoryId === categoryId && 
        p.active === true // Явно проверяем что товар активен
      );
      setProducts(filteredProducts);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
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
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}          renderItem={({ item }) => (
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
                        {item.stock > 0 ? `В наличии` : 'Нет'}
                      </Text>
                      <TouchableOpacity 
                        style={{ backgroundColor: item.stock > 0 ? '#4caf50' : '#ccc', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 'auto' }} 
                        disabled={item.stock <= 0}
                        onPress={() => openProductCard(item)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Купить</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Нет товаров</Text>}
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
});
