import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useCart } from '../CartContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useAuthModal } from '../AuthContext';
import { decodeToken } from '../utils/tokenUtils';

// Styles definition moved to top for reference
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantity: {
    paddingHorizontal: 12,
    fontSize: 16,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    color: '#e53935',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  modalScroll: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  deliveryMethodContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  deliveryMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  deliveryMethodButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  deliveryMethodText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  deliveryMethodTextActive: {
    color: '#2196f3',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

// Memoized CartItem component with proper prop types
interface CartItemProps {
  item: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    isByWeight: boolean;
    stock: number;
  };
  onUpdateQuantity: (id: number, quantity: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const CartItem = React.memo<CartItemProps>(({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  // Memoize callbacks for this specific item
  const handleIncrease = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleDecrease = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity - 1);
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  return (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString()} ₽{item.isByWeight ? '/кг' : ''}</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={handleDecrease}
          style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
          disabled={item.quantity <= 1}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantity}>
          {item.quantity} {item.isByWeight ? 'кг' : 'шт'}
        </Text>
        
        <TouchableOpacity
          onPress={handleIncrease}
          style={[styles.quantityButton, item.quantity >= item.stock && styles.disabledButton]}
          disabled={item.quantity >= item.stock}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleRemove}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.stock === nextProps.item.stock
  );
});

export default function CartScreen() {
  const { items, loading, error, updateQuantity, removeFromCart, getTotalSum, refreshCart } = useCart();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: '',
    email: '',
    address: '',
    deliveryMethod: 'Самовывоз',
    paymentMethod: 'картой',
    comment: ''
  });
  const [user, setUser] = useState(null);
  const { setShowAuthModal } = useAuthModal();

  // Memoize handler functions to prevent unnecessary re-renders
  const handleUpdateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    await updateQuantity(productId, newQuantity);
  }, [updateQuantity]);

  const handleRemoveFromCart = useCallback(async (productId: number) => {
    await removeFromCart(productId);
  }, [removeFromCart]);
  // Memoize the cart items to prevent unnecessary re-renders
  const cartItems = useMemo(() => {
    if (!items) return [];
    return items.map(item => (
      <CartItem
        key={item.id}
        item={item}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
      />
    ));
  }, [items, handleUpdateQuantity, handleRemoveFromCart]);

  // Load user data when modal opens
  useEffect(() => {
    if (showOrderModal) {
      loadUserData();
    }
  }, [showOrderModal]);

  const loadUserData = async () => {
    try {      const res = await api.get('/users');
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const tokenData = decodeToken(token);
        if (!tokenData) {
          throw new Error('Invalid token data');
        }
        const currentUser = res.data.find((u: any) => u.email === tokenData.email);
        if (currentUser) {
          setUser(currentUser);
          setOrderForm(prev => ({
            ...prev,
            name: currentUser.name || '',
            email: currentUser.email || '',
            address: currentUser.address || ''
          }));
        }
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  };

  const handleSubmitOrder = async () => {
    // Check authentication
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert(
        'Требуется авторизация',
        'Для оформления заказа необходимо войти в аккаунт',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Войти', onPress: () => {
            setShowOrderModal(false);
            setShowAuthModal(true);
          }}
        ]
      );
      return;
    }

    // Validate form
    if (!orderForm.name.trim() || !orderForm.email.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните имя и email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderForm.email.trim())) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите корректный email');
      return;
    }

    if (orderForm.deliveryMethod === 'Доставка' && !orderForm.address.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите адрес доставки');
      return;
    }    try {
      const tokenData = decodeToken(token);
      if (!tokenData) {
        throw new Error('Invalid token data');
      }
      const userId = tokenData.id;

      const orderData = {
        userId,
        ...orderForm,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalSum()
      };

      await api.post('/orders', orderData);
      Alert.alert(
        'Заказ отправлен',
        'Спасибо за заказ! Мы свяжемся с вами для подтверждения.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setShowOrderModal(false);
            refreshCart();
          }
        }]
      );
    } catch (e) {
      console.error('Error submitting order:', e);
      Alert.alert(
        'Ошибка',
        'Не удалось отправить заказ. Попробуйте позже.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refreshCart} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Корзина пуста</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshCart} />
        }
      >
        {cartItems}
      </ScrollView>

      <View style={styles.totalContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>
            Итого: {getTotalSum().toLocaleString()} ₽
          </Text>
          <TouchableOpacity 
            style={[styles.checkoutButton, items.length === 0 && styles.checkoutButtonDisabled]}
            onPress={() => setShowOrderModal(true)}
            disabled={items.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Оформить</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оформление заказа</Text>
              <TouchableOpacity 
                onPress={() => setShowOrderModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Имя</Text>
              <TextInput
                style={styles.input}
                value={orderForm.name}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, name: text }))}
                placeholder="Ваше имя"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={orderForm.email}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, email: text }))}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Способ получения</Text>
              <View style={styles.deliveryMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.deliveryMethodButton,
                    orderForm.deliveryMethod === 'Самовывоз' && styles.deliveryMethodButtonActive
                  ]}
                  onPress={() => setOrderForm(prev => ({ ...prev, deliveryMethod: 'Самовывоз' }))}
                >
                  <Text style={[
                    styles.deliveryMethodText,
                    orderForm.deliveryMethod === 'Самовывоз' && styles.deliveryMethodTextActive
                  ]}>Самовывоз</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deliveryMethodButton,
                    orderForm.deliveryMethod === 'Доставка' && styles.deliveryMethodButtonActive
                  ]}
                  onPress={() => setOrderForm(prev => ({ ...prev, deliveryMethod: 'Доставка' }))}
                >
                  <Text style={[
                    styles.deliveryMethodText,
                    orderForm.deliveryMethod === 'Доставка' && styles.deliveryMethodTextActive
                  ]}>Доставка</Text>
                </TouchableOpacity>
              </View>

              {orderForm.deliveryMethod === 'Доставка' && (
                <>
                  <Text style={styles.inputLabel}>Адрес доставки</Text>
                  <TextInput
                    style={styles.input}
                    value={orderForm.address}
                    onChangeText={(text) => setOrderForm(prev => ({ ...prev, address: text }))}
                    placeholder="Укажите адрес доставки"
                    multiline
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Способ оплаты</Text>
              <View style={styles.deliveryMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.deliveryMethodButton,
                    orderForm.paymentMethod === 'картой' && styles.deliveryMethodButtonActive
                  ]}
                  onPress={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'картой' }))}
                >
                  <Text style={[
                    styles.deliveryMethodText,
                    orderForm.paymentMethod === 'картой' && styles.deliveryMethodTextActive
                  ]}>Картой</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deliveryMethodButton,
                    orderForm.paymentMethod === 'наличные' && styles.deliveryMethodButtonActive
                  ]}
                  onPress={() => setOrderForm(prev => ({ ...prev, paymentMethod: 'наличные' }))}
                >
                  <Text style={[
                    styles.deliveryMethodText,
                    orderForm.paymentMethod === 'наличные' && styles.deliveryMethodTextActive
                  ]}>Наличными</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Комментарий к заказу</Text>
              <TextInput
                style={[styles.input, styles.commentInput]}
                value={orderForm.comment}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, comment: text }))}
                placeholder="Дополнительная информация к заказу"
                multiline
              />

              <TouchableOpacity
                style={[styles.submitButton]}
                onPress={handleSubmitOrder}
              >
                <Text style={styles.submitButtonText}>Заказать</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
