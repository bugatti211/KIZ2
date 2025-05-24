import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import api from '../api';

interface Supply {
  id: number;
  date: string;
  items: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
    };
  }[];
}

export default function SupplyHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const navigation = useNavigation();

  // Set up header back button without label
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton
          onPress={() => navigation.goBack()}
          label=""
        />
      ),
    });
  }, [navigation]);

  // Fetch supplies when component mounts
  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/supplies');
      setSupplies(response.data);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить историю поставок');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={supplies}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.supplyItem}>
            <Text style={styles.supplyDate}>
              {formatDate(item.date)}
            </Text>
            <View style={styles.itemsContainer}>
              {item.items.map(supplyItem => (
                <View key={supplyItem.id} style={styles.supplyItemRow}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {supplyItem.product.name}
                  </Text>
                  <Text style={styles.quantity}>
                    {supplyItem.quantity} шт.
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>История поставок пуста</Text>
        }
      />
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
  supplyItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  supplyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  supplyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});
