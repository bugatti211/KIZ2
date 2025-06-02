import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';

interface SaleItem {
  productId: number;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Sale {
  id: number;
  date: string;
  total: number;
  items: SaleItem[];
}

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);      const response = await api.get('/sales/all');
      setSales(response.data);    } catch (error: any) {
      console.error('Error loading sales history:', error);
      const errorMessage = error.response?.data?.error || 'Не удалось загрузить историю продаж';
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaleDetails = (saleId: number) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
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
      <View style={styles.header}>
        <Text style={styles.headerText}>История продаж</Text>
      </View>

      <ScrollView>
        {sales.length > 0 ? (
          sales.map((sale) => (
            <View key={sale.id} style={styles.saleItem}>
              <TouchableOpacity
                style={styles.saleHeader}
                onPress={() => toggleSaleDetails(sale.id)}
              >
                <Text style={styles.saleDate}>
                  {new Date(sale.date).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.saleTotal}>{sale.total.toLocaleString()} ₽</Text>
                  <Ionicons
                    name={expandedSale === sale.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#666"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {expandedSale === sale.id && (
                <View style={styles.saleDetails}>
                  {sale.items.map((item, index) => (
                    <View key={index} style={styles.productItem}>
                      <Text style={styles.productName}>{item.product.name}</Text>
                      <Text style={styles.productInfo}>
                        {item.quantity} × {item.price.toLocaleString()} ₽ = {(item.quantity * item.price).toLocaleString()} ₽
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noSalesText}>История продаж пуста</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
    elevation: 2,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saleItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  saleHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saleDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productInfo: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSalesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});