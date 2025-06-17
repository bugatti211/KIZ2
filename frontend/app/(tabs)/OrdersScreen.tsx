import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  updatedAt: string;
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

type Tab = 'Доставка' | 'Самовывоз';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Доставка');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.filter((order: Order) => order.status !== 'confirmed'));
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const handleConfirmOrder = useCallback(async (orderId: number) => {
    Alert.alert(
      'Подтверждение заказа',
      'Вы уверены, что хотите подтвердить этот заказ? После подтверждения он будет скрыт из списка.',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Подтвердить',
          onPress: async () => {
            try {
              await api.post(`/orders/${orderId}/confirm`);
              // Обновляем список заказов после подтверждения
              fetchOrders();
            } catch (error) {
              console.error('Error confirming order:', error);
              Alert.alert('Ошибка', 'Не удалось подтвердить заказ');
            }
          }
        }
      ]
    );
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => order.deliveryMethod === activeTab);

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

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const isExpanded = expandedOrders.includes(order.id);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => toggleOrderExpansion(order.id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>Заказ №{order.id}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.orderUpdateDate}>
              Обновлено: {formatDate(order.updatedAt)}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666"
          />
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.customerInfo}>
            <Text style={styles.label}>Клиент: </Text>
            {order.name}
          </Text>
          <Text style={styles.total}>
            Итого: {order.total.toLocaleString()} ₽
          </Text>
        </View>

        {isExpanded && (
          <>
            <View style={styles.expandedInfo}>
              <Text style={styles.customerInfo}>
                <Text style={styles.label}>Email: </Text>
                {order.email}
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
              <Text style={styles.customerInfo}>
                <Text style={styles.label}>Статус: </Text>
                {order.status}
              </Text>
              <Text style={styles.customerInfo}>
                <Text style={styles.label}>Обновлено: </Text>
                {formatDate(order.updatedAt)}
              </Text>
            </View>

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

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={(e) => {
                e.stopPropagation();
                handleConfirmOrder(order.id);
              }}
            >
              <Text style={styles.confirmButtonText}>Подтвердить заказ</Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Доставка' && styles.activeTab
          ]}
          onPress={() => setActiveTab('Доставка')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Доставка' && styles.activeTabText
          ]}>Доставка</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Самовывоз' && styles.activeTab
          ]}
          onPress={() => setActiveTab('Самовывоз')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Самовывоз' && styles.activeTabText
          ]}>Самовывоз</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
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
                Нет заказов с типом "{activeTab}"
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },  orderHeaderLeft: {
    flex: 1,
  },
  expandedInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
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
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderUpdateDate: {
    fontSize: 12,
    color: '#999',
  },
  orderInfo: {
    marginBottom: 16,
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
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
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
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  }
});
