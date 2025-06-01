import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { Product } from '../models/product.model';
import { Sale, SaleItem, SaleStatistics } from '../models/sale.model';

interface ValidationErrors {
  quantity: string;
  price: string;
}

interface SaleProduct {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export default function OfflineSalesScreen() {
  // State management
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Statistics state
  const [todayStats, setTodayStats] = useState<SaleStatistics | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<SaleStatistics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    quantity: '',
    price: ''
  });

  const validateInputs = (): boolean => {
    const newErrors = { quantity: '', price: '' };
    let isValid = true;

    // Validate quantity
    if (!selectedProduct) {
      newErrors.quantity = 'Выберите товар';
      isValid = false;
    } else {
      const numQuantity = Number(currentQuantity);
      if (!currentQuantity || isNaN(numQuantity) || numQuantity <= 0) {
        newErrors.quantity = 'Введите корректное количество';
        isValid = false;
      } else {
        const isWeightCategory = selectedProduct.category?.name === 'На развес';
        if (isWeightCategory) {
          // For weight products - check decimals (up to 2 decimal places)
          const decimalParts = currentQuantity.split('.');
          if (decimalParts.length > 1 && decimalParts[1].length > 2) {
            newErrors.quantity = 'Укажите вес с точностью до сотых (кг)';
            isValid = false;
          }
        } else {
          // For unit products - must be integer
          if (!Number.isInteger(numQuantity)) {
            newErrors.quantity = 'Количество должно быть целым числом';
            isValid = false;
          }
        }
        
        // Check stock
        if (numQuantity > selectedProduct.stock) {
          newErrors.quantity = `Доступно только ${selectedProduct.stock} ${isWeightCategory ? 'кг' : 'шт.'}`;
          isValid = false;
        }
      }
    }

    // Validate price
    const numPrice = Number(currentPrice);
    if (!currentPrice || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Введите корректную цену';
      isValid = false;
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  // Load data with error handling
  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [productsRes, salesRes, todayRes, monthlyRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/sales/today'),
        api.get('/sales/monthly')
      ]);
      setProducts(productsRes.data.filter((p: Product) => p.active));
      setSales(salesRes.data);
      setTodayStats(todayRes.data);
      setMonthlyStats(monthlyRes.data);
    } catch (e) {
      console.error('Error loading sales data:', e);
      Alert.alert('Ошибка', 'Не удалось загрузить данные о продажах. Проверьте подключение к интернету.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const addProductToSale = () => {
    if (!validateInputs()) {
      return;
    }

    if (selectedProduct && currentQuantity && currentPrice) {
      const quantity = Number(currentQuantity);
      const price = Number(currentPrice);
      const total = quantity * price;

      // Check if product already exists in sale
      const existingIndex = saleProducts.findIndex(p => p.productId === selectedProduct.id);
      
      if (existingIndex >= 0) {
        // Update existing product
        const updatedProducts = [...saleProducts];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          quantity: updatedProducts[existingIndex].quantity + quantity,
          total: updatedProducts[existingIndex].total + total
        };
        setSaleProducts(updatedProducts);
      } else {
        // Add new product
        setSaleProducts([...saleProducts, {
          productId: selectedProduct.id,
          product: selectedProduct,
          quantity,
          price,
          total
        }]);
      }

      // Reset form
      setSelectedProduct(null);
      setCurrentQuantity('');
      setCurrentPrice('');
      setShowProductSelector(false);
    }
  };

  const removeProductFromSale = (productId: number) => {
    setSaleProducts(saleProducts.filter(p => p.productId !== productId));
  };

  const getTotalSaleAmount = () => {
    return saleProducts.reduce((sum, item) => sum + item.total, 0);
  };

  const completeSale = async () => {
    if (saleProducts.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один товар');
      return;
    }

    try {
      setIsSubmitting(true);
      const saleData = {
        items: saleProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await api.post('/sales', saleData);
      Alert.alert('Успех', 'Продажа успешно сохранена');
      
      // Reset form and reload data
      setSaleProducts([]);
      setShowNewSaleModal(false);
      await loadData();
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || 'Не удалось сохранить продажу';
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPrice(product.price.toString());
    setShowProductSelector(false);
  };

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Статистика */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Статистика продаж</Text>
        
        <Text style={styles.statsSubtitle}>Сегодня:</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Общая сумма:</Text>
          <Text style={styles.statsValue}>{todayStats?.totalAmount?.toLocaleString() || '0'} ₽</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Количество продаж:</Text>
          <Text style={styles.statsValue}>{todayStats?.totalSales || '0'}</Text>
        </View>

        <Text style={styles.statsSubtitle}>За месяц:</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Общая сумма:</Text>
          <Text style={styles.statsValue}>{monthlyStats?.totalAmount?.toLocaleString() || '0'} ₽</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Количество продаж:</Text>
          <Text style={styles.statsValue}>{monthlyStats?.totalSales || '0'}</Text>
        </View>
      </View>

      {/* Кнопка новой продажи */}
      <TouchableOpacity 
        style={styles.newSaleButton}
        onPress={() => setShowNewSaleModal(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.newSaleButtonText}>Новая продажа</Text>
      </TouchableOpacity>

      {/* История продаж */}
      <Text style={styles.sectionTitle}>История продаж</Text>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.saleCard}>
            <View style={styles.saleHeader}>
              <Text style={styles.saleDate}>
                {new Date(item.date).toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <Text style={styles.saleTotal}>{item.total.toLocaleString()} ₽</Text>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>История продаж пуста</Text>
        }
      />

      {/* Модальное окно новой продажи */}
      <Modal
        visible={showNewSaleModal}
        animationType="slide"
        onRequestClose={() => setShowNewSaleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новая продажа</Text>
            <TouchableOpacity 
              onPress={() => setShowNewSaleModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContentScroll}>
            <View style={styles.modalContent}>
              <View style={styles.selectedProducts}>
                {saleProducts.map(item => (
                  <View key={item.productId} style={styles.saleProductItem}>
                    <View style={styles.saleProductDetails}>
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
                    <View style={styles.saleProductTotal}>
                      <Text style={styles.total}>{item.total.toLocaleString()} ₽</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeProductFromSale(item.productId)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff0000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Кнопка добавления товара */}
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => setShowProductSelector(true)}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addProductButtonText}>Добавить товар</Text>
              </TouchableOpacity>

              {/* Завершение продажи */}
              <View style={styles.completeSaleContainer}>
                <Text style={styles.totalLabel}>
                  Итого: {getTotalSaleAmount().toLocaleString()} ₽
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
          </ScrollView>
        </View>
      </Modal>

      {/* Модальное окно выбора товара */}
      <Modal
        visible={showProductSelector}
        animationType="slide"
        onRequestClose={() => setShowProductSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выбор товара</Text>
            <TouchableOpacity
              onPress={() => setShowProductSelector(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContentScroll}>
            <View style={styles.modalContent}>
              <FlatList
                data={products}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => handleProductSelect(item)}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productStock}>
                        В наличии: {item.category?.name === 'На развес'
                          ? `${item.stock.toFixed(2)} кг`
                          : `${Math.floor(item.stock)} шт.`}
                      </Text>
                      <Text style={styles.productPrice}>{item.price.toLocaleString()} ₽</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Нет доступных товаров</Text>
                }
              />

              {selectedProduct && (
                <View style={styles.modalContent}>
                  <Text style={styles.sectionTitle}>Количество и цена</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, validationErrors.quantity ? styles.inputError : null]}
                      placeholder={`Количество (${selectedProduct.category?.name === 'На развес' ? 'кг' : 'шт.'})`}
                      keyboardType="numeric"
                      value={currentQuantity}
                      onChangeText={(text) => {
                        setCurrentQuantity(text);
                        setValidationErrors(prev => ({ ...prev, quantity: '' }));
                      }}
                    />
                    {validationErrors.quantity ? (
                      <Text style={styles.errorText}>{validationErrors.quantity}</Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, validationErrors.price ? styles.inputError : null]}
                      placeholder="Цена за единицу"
                      keyboardType="numeric"
                      value={currentPrice}
                      onChangeText={(text) => {
                        setCurrentPrice(text);
                        setValidationErrors(prev => ({ ...prev, price: '' }));
                      }}
                    />
                    {validationErrors.price ? (
                      <Text style={styles.errorText}>{validationErrors.price}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.addProductButton, !selectedProduct && styles.addProductButtonDisabled]}
                    onPress={addProductToSale}
                    disabled={!selectedProduct}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addProductButtonText}>Добавить в продажу</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statsSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newSaleButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newSaleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    elevation: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    padding: 16,
  },
  modalContentScroll: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedProducts: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  saleProductDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 14,
    color: '#666',
  },
  saleProductTotal: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    color: '#4CAF50',
  },
  removeButton: {
    padding: 8,
  },
  addProductButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonLoader: {
    padding: 8,
  },
  completeSaleContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  saleProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quantityPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});