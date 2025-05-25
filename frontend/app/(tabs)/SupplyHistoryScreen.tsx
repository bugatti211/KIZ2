import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
  ScrollView
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
      category?: {
        id: number;
        name: string;
      };
    };
  }[];
}

export default function SupplyHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Настройка кнопки "Назад"
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

  // Загрузка поставок при монтировании компонента
  useEffect(() => {
    fetchSupplies();
  }, []);
  const fetchSupplies = async () => {
    try {
      const response = await api.get('/supplies');
      setSupplies(response.data || []); // Ensure we always have an array
    } catch (e: any) {
      console.error('Error fetching supplies:', e);      Alert.alert(
        'Ошибка',
        'Не удалось загрузить историю поставок: ' + (e?.response?.data?.error || e?.message || 'Ошибка сервера')
      );
      setSupplies([]); // Reset to empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSupplies();
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
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={supplies}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.supplyItem}
            onPress={() => {
              setSelectedSupply(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.supplyDate}>
              {formatDate(item.date)}
            </Text>
            <Text style={styles.totalItems}>
              Товаров в поставке: {item.items.length}
            </Text>
            <Text style={styles.tapHint}>
              Нажмите для просмотра деталей
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>История поставок пуста</Text>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedSupply(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Детали поставки от {selectedSupply ? formatDate(selectedSupply.date) : ''}
            </Text>
            
            <ScrollView style={styles.modalScroll}>
              {selectedSupply?.items.map(item => (
                <View key={item.id} style={styles.supplyItemRow}>                  <Text style={styles.productName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.quantity}>
                    {item.product.category?.name === 'На развес' ? item.quantity.toFixed(2) : item.quantity} {item.product.category?.name === 'На развес' ? 'кг' : 'шт.'}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedSupply(null);
              }}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
  },
  totalItems: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: '80%',
  },
  supplyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});
