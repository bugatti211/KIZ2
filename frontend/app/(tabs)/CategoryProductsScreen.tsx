import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Button } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../api';
import BottomSheet from '@gorhom/bottom-sheet';

export default function CategoryProductsScreen() {
  const route = useRoute();
  // @ts-ignore
  const { category, categoryId } = route.params || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '90%'], []);

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      // Фильтруем по категории
      setProducts(res.data.filter((p: any) => p.categoryId === categoryId));
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openProductSheet = (product: any) => {
    setSelectedProduct(product);
    setTimeout(() => bottomSheetRef.current?.expand(), 10);
  };
  const closeProductSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedProduct(null);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{category}</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openProductSheet(item)}>
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
                      <TouchableOpacity style={{ backgroundColor: item.stock > 0 ? '#4caf50' : '#ccc', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 'auto' }} disabled={item.stock <= 0}>
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
      {/* Bottom Sheet карточка товара */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={closeProductSheet}
      >
        {selectedProduct && (
          <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
            {/* Картинка/иконка по центру сверху */}
            <Image source={require('../../assets/images/icon.png')} style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }} />
            {/* Название */}
            <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8, textAlign: 'center' }}>{selectedProduct.name}</Text>
            {/* Описание */}
            <Text style={{ fontSize: 15, color: '#444', marginBottom: 8, textAlign: 'center' }}>{selectedProduct.description}</Text>
            {/* Применение/рекомендации */}
            <Text style={{ fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' }}>{selectedProduct.recommendations}</Text>
            {/* Остаток, цена, кнопка купить */}
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: selectedProduct.stock > 0 ? '#388e3c' : '#d11a2a', fontWeight: 'bold' }}>
                {selectedProduct.stock > 0 ? `Остаток: ${selectedProduct.stock}` : 'Нет в наличии'}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>{selectedProduct.price} ₽</Text>
            </View>
            <Button title="Купить" color="#4caf50" disabled={selectedProduct.stock <= 0} onPress={() => {}} />
          </View>
        )}
      </BottomSheet>
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
