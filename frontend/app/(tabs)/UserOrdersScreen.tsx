import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeToken } from '../utils/tokenUtils';
import api from '../api';

type Order = {
  id: number;
  userId: number;
  name: string;
  email: string;
  address: string;
  deliveryMethod: 'Самовывоз' | 'Доставка';
  paymentMethod: 'картой' | 'наличные';
  comment: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      isByWeight: boolean;
    };
  }>;
};

export default function UserOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setOrders([]);
        return;
      }

      const decodedToken = decodeToken(token);
      if (!decodedToken?.id) {
        setOrders([]);
        return;
      }      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В обработке';
      case 'confirmed':
        return 'Подтвержден';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA726';
      case 'confirmed':
        return '#66BB6A';
      case 'cancelled':
        return '#EF5350';
      default:
        return '#757575';
    }
  };

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const isExpanded = expandedOrders.includes(order.id);
    const statusColor = getStatusColor(order.status);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => toggleOrderExpansion(order.id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>Заказ №{order.id}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666"
          />
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
          <Text style={styles.total}>
            Итого: {order.total.toLocaleString()} ₽
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedInfo}>
            <Text style={styles.customerInfo}>
              <Text style={styles.label}>Способ получения: </Text>
              {order.deliveryMethod}
            </Text>
            {order.deliveryMethod === 'Доставка' && (
              <Text style={styles.customerInfo}>
                <Text style={styles.label}>Адрес: </Text>
                {order.address}
              </Text>
            )}
            <Text style={styles.customerInfo}>
              <Text style={styles.label}>Оплата: </Text>
              {order.paymentMethod}
            </Text>

            <View style={styles.itemsContainer}>
              <Text style={styles.itemsTitle}>Состав заказа:</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.quantity}>
                      {item.quantity} {item.product.isByWeight ? 'кг' : 'шт'}
                    </Text>
                    <Text style={styles.price}>{item.price.toLocaleString()} ₽</Text>
                  </View>
                </View>
              ))}
            </View>

            {order.comment && (
              <View style={styles.commentContainer}>
                <Text style={styles.commentLabel}>Комментарий:</Text>
                <Text style={styles.comment}>{order.comment}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              У вас пока нет заказов
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  customerInfo: {
    fontSize: 15,
    marginBottom: 4,
    color: '#333',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  itemsContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    minWidth: 80,
    textAlign: 'right',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  comment: {
    fontSize: 14,
    color: '#333',
  }
});
