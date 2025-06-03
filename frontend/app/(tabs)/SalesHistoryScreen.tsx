import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import api from '../api';

interface Sale {
  id: number;
  date: string;
  total: number;
}

interface Order {
  id: number;
  total: number;
  createdAt: string;
  status: string;
}

export default function SalesHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.goBack()} label="" />
      )
    });
  }, [navigation]);

  const fetchData = async () => {
    try {
      const [salesRes, ordersRes] = await Promise.all([
        api.get('/sales'),
        api.get('/orders')
      ]);
      setSales(salesRes.data || []);
      const confirmed = (ordersRes.data || []).filter((o: Order) => o.status === 'confirmed');
      setOrders(confirmed);
    } catch (e) {
      console.error('Error fetching sales history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
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
      <Text style={styles.sectionTitle}>Оффлайн-продажи</Text>
      {sales.length === 0 ? (
        <Text style={styles.emptyText}>Записей нет</Text>
      ) : (
        sales.map(sale => (
          <View key={`sale-${sale.id}`} style={styles.item}>
            <Text style={styles.date}>{formatDate(sale.date)}</Text>
            <Text style={styles.total}>Сумма: {Number(sale.total).toLocaleString()} ₽</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Закрытые заказы</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Записей нет</Text>
      ) : (
        orders.map(order => (
          <TouchableOpacity
            key={`order-${order.id}`}
            style={styles.item}
            onPress={() => navigation.navigate('OrderDetails', { order })}
          >
            <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333'
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
  total: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8
  }
});
