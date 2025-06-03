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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { Product } from '../models/product.model';

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
  // Form state management
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Load products
  const loadProducts = async () => {
    try {
      setIsLoadingData(true);
      const productsRes = await api.get('/products');
      setProducts(productsRes.data.filter((p: Product) => p.active));
    } catch (e) {
      console.error('Error loading products:', e);
      Alert.alert('Ошибка', 'Не удалось загрузить список товаров. Проверьте подключение к интернету.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadProducts();
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
      
      Alert.alert('Успех', 'Продажа успешно оформлена');
      setSaleProducts([]);
      setSelectedProduct(null);
      setCurrentQuantity('');
      setCurrentPrice('');
      
      // Refresh products to update stock
      loadProducts();
    } catch (e) {
      console.error('Error completing sale:', e);
      Alert.alert('Ошибка', 'Не удалось оформить продажу. Проверьте подключение к интернету.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.formContainer}>
        {/* Product selection */}
        <TouchableOpacity
          style={styles.productSelector}
          onPress={() => setShowProductSelector(true)}
        >
          <Text style={styles.label}>Товар:</Text>
          <Text style={styles.productName}>
            {selectedProduct ? selectedProduct.name : 'Выберите товар'}
          </Text>
        </TouchableOpacity>

        {/* Quantity input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Количество:</Text>
          <TextInput
            style={styles.input}
            value={currentQuantity}
            onChangeText={setCurrentQuantity}
            keyboardType="decimal-pad"
            placeholder="Введите количество"
          />
          {validationErrors.quantity ? (
            <Text style={styles.errorText}>{validationErrors.quantity}</Text>
          ) : null}
        </View>

        {/* Price display */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Цена:</Text>
          <View style={[styles.input, styles.priceDisplay]}>
            <Text style={styles.priceText}>
              {selectedProduct ? `${selectedProduct.price} ₽` : '—'}
            </Text>
          </View>
        </View>

        {/* Add product button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addProductToSale}
        >
          <Text style={styles.buttonText}>Добавить товар</Text>
        </TouchableOpacity>

        {/* Products list */}
        {saleProducts.length > 0 && (
          <View style={styles.productsContainer}>
            <Text style={styles.sectionTitle}>Добавленные товары:</Text>
            {saleProducts.map((item) => (
              <View key={item.productId} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productItemName}>{item.product.name}</Text>
                  <Text style={styles.productItemDetails}>
                    {item.quantity} x {item.price} ₽ = {item.total} ₽
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeProductFromSale(item.productId)}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>
                Итого: {getTotalSaleAmount()} ₽
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.completeButton, isSubmitting && styles.disabledButton]}
              onPress={completeSale}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Оформление...' : 'Оформить продажу'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Product selector modal */}
      <Modal
        visible={showProductSelector}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите товар</Text>
              <TouchableOpacity
                onPress={() => setShowProductSelector(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {isLoadingData ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productOption}
                    onPress={() => {
                      setSelectedProduct(item);
                      setCurrentPrice(item.price.toString());
                      setShowProductSelector(false);
                    }}
                  >
                    <Text style={styles.productOptionName}>{item.name}</Text>
                    <Text style={styles.productOptionStock}>
                      В наличии: {item.stock} {item.category?.name === 'На развес' ? 'кг' : 'шт.'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 16,
  },
  productSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  productName: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  totalContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  completeButton: {
    backgroundColor: '#4CD964',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  productOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productOptionName: {
    fontSize: 16,
    marginBottom: 4,
  },
  productOptionStock: {
    fontSize: 14,
    color: '#666',
  },
  priceDisplay: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 16,
    color: '#333',
  },
});