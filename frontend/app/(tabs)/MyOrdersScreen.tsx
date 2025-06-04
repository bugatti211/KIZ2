import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HeaderBackButton } from '@react-navigation/elements';
import { TabParamList, ProfileStackParamList } from '../types/navigation';
import api from './api';

interface Order {
  id: number;
  total: number;
  createdAt: string;
  status: string;
}

export default function MyOrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  type NavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList>,
    BottomTabNavigationProp<TabParamList>
  >;
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.goBack()} label="" />
      ),
      title: 'Мои заказы'
    });
  }, [navigation]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
      }
    >
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Записей нет</Text>
      ) : (
        orders.map(order => (
          <TouchableOpacity
            key={order.id}
            style={styles.item}
            onPress={() => navigation.navigate('OrderDetails', { order })}
          >
            <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.status}>Статус: {order.status}</Text>
            <Text style={styles.total}>Сумма: {Number(order.total).toLocaleString()} ₽</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  item: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  date: {
    fontSize: 14,
    color: '#666'
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  total: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 4
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20
  }
});
