import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/OfflineSalesScreenStyles';
import api from '../api';
import { Product } from '../models/product.model';

interface SaleProduct {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export default function OfflineSalesScreen() {
  // State management
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    quantity: '',
    price: ''
  });

  // Load products data
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingData(true);
      const response = await api.get('/products');
      setProducts(response.data.filter((p: Product) => p.active));
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить товары');
    } finally {
      setIsLoadingData(false);
    }
  };

  const validateInputs = (): boolean => {
    const errors = { quantity: '', price: '' };
    let isValid = true;

    if (!selectedProduct) {
      errors.quantity = 'Выберите товар';
      isValid = false;
    } else {
      const numQuantity = Number(currentQuantity);
      if (!currentQuantity || isNaN(numQuantity) || numQuantity <= 0) {
        errors.quantity = 'Введите корректное количество';
        isValid = false;
      } else if (numQuantity > selectedProduct.stock) {
        errors.quantity = `Доступно только ${selectedProduct.stock} ${
          selectedProduct.category?.name === 'На развес' ? 'кг' : 'шт.'
        }`;
        isValid = false;
      }
    }

    const numPrice = Number(currentPrice);
    if (!currentPrice || isNaN(numPrice) || numPrice <= 0) {
      errors.price = 'Введите корректную цену';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const addProductToSale = () => {
    if (!validateInputs() || !selectedProduct) return;

    const quantity = Number(currentQuantity);
    const price = Number(currentPrice);
    const total = quantity * price;

    const existingIndex = saleProducts.findIndex(p => p.productId === selectedProduct.id);
    
    if (existingIndex >= 0) {
      const updatedProducts = [...saleProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: updatedProducts[existingIndex].quantity + quantity,
        total: updatedProducts[existingIndex].total + total
      };
      setSaleProducts(updatedProducts);
    } else {
      setSaleProducts([...saleProducts, {
        productId: selectedProduct.id,
        product: selectedProduct,
        quantity,
        price,
        total
      }]);
    }

    setSelectedProduct(null);
    setCurrentQuantity('');
    setCurrentPrice('');
  };

  const removeProduct = (productId: number) => {
    setSaleProducts(saleProducts.filter(p => p.productId !== productId));
  };

  const getTotalAmount = () => {
    return saleProducts.reduce((sum, item) => sum + item.total, 0);
  };

  const completeSale = async () => {
    if (saleProducts.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один товар');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/sales', {
        items: saleProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      });

      Alert.alert('Успех', 'Продажа успешно сохранена');
      setSaleProducts([]);
      await loadProducts();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить продажу');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Новая продажа</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.selectedProducts}>
          {saleProducts.map(item => (
            <View key={item.productId} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <View style={styles.quantityPrice}>
                  <Text style={styles.quantity}>
                    {item.product.category?.name === 'На развес'
                      ? `${item.quantity.toFixed(2)} кг`
                      : `${item.quantity} шт.`}
                  </Text>
                  <Text style={styles.price}>× {item.price.toLocaleString()} ₽</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.total}>{item.total.toLocaleString()} ₽</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeProduct(item.productId)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff0000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View>
          {products.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {products.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productItem,
                      { marginRight: 8, width: 200 }
                    ]}
                    onPress={() => {
                      setSelectedProduct(product);
                      setCurrentPrice(product.price.toString());
                    }}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.price}>{product.price.toLocaleString()} ₽</Text>
                      <Text style={styles.quantity}>
                        В наличии: {product.category?.name === 'На развес'
                          ? `${product.stock.toFixed(2)} кг`
                          : `${Math.floor(product.stock)} шт.`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedProduct && (
                <View style={{ marginTop: 16 }}>
                  <TextInput
                    style={styles.input}
                    placeholder={`Количество (${
                      selectedProduct.category?.name === 'На развес' ? 'кг' : 'шт.'
                    })`}
                    keyboardType="numeric"
                    value={currentQuantity}
                    onChangeText={text => {
                      setCurrentQuantity(text);
                      setValidationErrors(prev => ({ ...prev, quantity: '' }));
                    }}
                  />
                  {validationErrors.quantity ? (
                    <Text style={styles.errorText}>{validationErrors.quantity}</Text>
                  ) : null}

                  <TextInput
                    style={styles.input}
                    placeholder="Цена за единицу"
                    keyboardType="numeric"
                    value={currentPrice}
                    onChangeText={text => {
                      setCurrentPrice(text);
                      setValidationErrors(prev => ({ ...prev, price: '' }));
                    }}
                  />
                  {validationErrors.price ? (
                    <Text style={styles.errorText}>{validationErrors.price}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addProductToSale}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Добавить в продажу</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={{ textAlign: 'center', color: '#666' }}>
              Нет доступных товаров
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.totalAmount}>
          Итого: {getTotalAmount().toLocaleString()} ₽
        </Text>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (isSubmitting || saleProducts.length === 0) && styles.disabledButton
          ]}
          onPress={completeSale}
          disabled={isSubmitting || saleProducts.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" style={styles.buttonLoader} />
          ) : (
            <Text style={styles.completeButtonText}>Завершить продажу</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}