import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { cartApi } from './api';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isByWeight: boolean;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (product: any, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  getTotalSum: () => number;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await cartApi.getCart();
      setItems(cartData);
    } catch (err) {
      setError('Не удалось загрузить корзину');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product: any, quantity: number) => {
    try {
      setLoading(true);
      await cartApi.addToCart(product.id, quantity);
      await refreshCart();
      Alert.alert('Успешно', 'Товар добавлен в корзину');
    } catch (err) {
      setError('Не удалось добавить товар в корзину');
      Alert.alert('Ошибка', 'Не удалось добавить товар в корзину');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      setLoading(true);
      await cartApi.removeFromCart(productId);
      await refreshCart();
    } catch (err) {
      setError('Не удалось удалить товар из корзины');
      console.error('Error removing from cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      await cartApi.updateCartItem(productId, quantity);
      await refreshCart();
    } catch (err) {
      setError('Не удалось обновить количество товара');
      console.error('Error updating quantity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSum = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartApi.clearCart();
      setItems([]);
    } catch (err) {
      setError('Не удалось очистить корзину');
      console.error('Error clearing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalSum,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}