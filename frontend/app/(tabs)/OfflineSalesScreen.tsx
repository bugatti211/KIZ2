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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Statistics state
  const [todayStats, setTodayStats] = useState<SaleStatistics | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<SaleStatistics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
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
      Alert.alert('Ошибка', 'Не удалось загрузить данные о продажах');
    } finally {
      setLoading(false);
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
      loadData();
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || 'Не удалось сохранить продажу';
      Alert.alert('Ошибка', errorMessage);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPrice(product.price.toString());
    setShowProductSelector(false);
  };

  const validateQuantity = (quantity: string) => {
    if (!selectedProduct) return false;

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) return false;

    const isWeightCategory = selectedProduct.category?.name === 'На развес';
    if (isWeightCategory) {
      // For weight products - check decimals
      const decimalParts = quantity.split('.');
      if (decimalParts.length > 1 && decimalParts[1].length > 2) return false;
    } else {
      // For unit products - must be integer
      if (!Number.isInteger(numQuantity)) return false;
    }

    return numQuantity <= selectedProduct.stock;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Оффлайн-продажи</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewSaleModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Новая продажа</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Сегодня</Text>
          <Text style={styles.statsValue}>
            {todayStats ? `${todayStats.totalAmount.toLocaleString()} ₽` : '0 ₽'}
          </Text>
          <Text style={styles.statsSubtitle}>
            {todayStats ? `${todayStats.totalSales} продаж` : '0 продаж'}
          </Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>За месяц</Text>
          <Text style={styles.statsValue}>
            {monthlyStats ? `${monthlyStats.totalAmount.toLocaleString()} ₽` : '0 ₽'}
          </Text>
          <Text style={styles.statsSubtitle}>
            {monthlyStats ? `${monthlyStats.totalSales} продаж` : '0 продаж'}
          </Text>
        </View>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет продаж</Text>
        }
        renderItem={({ item: sale }) => (
          <View style={styles.saleCard}>
            <View style={styles.saleHeader}>
              <Text style={styles.saleDate}>
                {new Date(sale.date).toLocaleDateString()}
              </Text>
              <Text style={styles.saleTotal}>{sale.total.toLocaleString()} ₽</Text>
            </View>
            <FlatList
              data={sale.items}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.saleProductItem}>
                  <View style={styles.saleProductDetails}>                    <Text style={styles.productName}>
                      {item.product?.name || 'Товар'}
                    </Text>
                    <View style={styles.quantityPrice}>
                      <Text style={styles.quantity}>
                        {item.quantity} {item.product?.category?.name === 'На развес' ? 'кг' : 'шт'}
                      </Text>
                      <Text style={styles.price}>× {item.price.toLocaleString()} ₽</Text>
                    </View>
                  </View>
                  <View style={styles.saleProductTotal}>
                    <Text style={styles.total}>{item.total.toLocaleString()} ₽</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      />

      {/* New Sale Modal */}
      <Modal
        visible={showNewSaleModal}
        animationType="slide"
        onRequestClose={() => setShowNewSaleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новая продажа</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNewSaleModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selected Products */}
            <View style={styles.selectedProducts}>
              <Text style={styles.sectionTitle}>Выбранные товары</Text>
              {saleProducts.map(item => (
                <View key={item.productId} style={styles.saleProductItem}>
                  <View style={styles.saleProductDetails}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <View style={styles.quantityPrice}>
                      <Text style={styles.quantity}>
                        {item.quantity} {item.product.category?.name === 'На развес' ? 'кг' : 'шт'}
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

            {/* Add Product Form */}
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => setShowProductSelector(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addProductButtonText}>Добавить товар</Text>
            </TouchableOpacity>

            {/* Product Selection */}
            <Modal
              visible={showProductSelector}
              animationType="slide"
              onRequestClose={() => setShowProductSelector(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Выбор товара</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowProductSelector(false)}
                  >
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={products}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.productItem}
                      onPress={() => handleProductSelect(item)}
                    >
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productStock}>
                        В наличии: {item.stock} {item.category?.name === 'На развес' ? 'кг' : 'шт'}
                      </Text>
                      <Text style={styles.productPrice}>{item.price.toLocaleString()} ₽</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Modal>

            {selectedProduct && (
              <View>
                <Text style={styles.sectionTitle}>Количество и цена</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Количество (${selectedProduct.category?.name === 'На развес' ? 'кг' : 'шт'})`}
                  keyboardType="numeric"
                  value={currentQuantity}
                  onChangeText={setCurrentQuantity}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Цена за единицу"
                  keyboardType="numeric"
                  value={currentPrice}
                  onChangeText={setCurrentPrice}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addProductToSale}
                >
                  <Text style={styles.addButtonText}>Добавить</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Complete Sale Button */}
            {saleProducts.length > 0 && (
              <View style={styles.completeSaleContainer}>
                <Text style={styles.totalLabel}>
                  Итого: {getTotalSaleAmount().toLocaleString()} ₽
                </Text>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={completeSale}
                >
                  <Text style={styles.completeButtonText}>Завершить продажу</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saleCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  saleProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  saleProductDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    marginBottom: 4,
  },
  quantityPrice: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedProducts: {
    marginBottom: 24,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
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
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    fontSize: 16,
  },
  productItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 4,
  },
});