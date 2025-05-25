import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import api from '../api';
import { Product } from '../models/product.model';

interface SupplyItem {
  productId: number;
  quantity: number;
  product: Product;
}

export default function NewSupplyScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SupplyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить список товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.some(item => item.productId === product.id)) {
      Alert.alert('Внимание', 'Этот товар уже добавлен в поставку');
      return;
    }

    setSelectedProducts([
      ...selectedProducts,
      { productId: product.id, quantity: 0, product }
    ]);
  };
  const handleUpdateQuantity = (productId: number, quantity: string) => {
    const product = products.find(p => p.id === productId);
    const isWeightCategory = product?.category?.name === 'На развес';
    
    let numQuantity;
    if (isWeightCategory) {
      numQuantity = parseFloat(quantity) || 0;
    } else {
      numQuantity = parseInt(quantity) || 0;
    }
    
    setSelectedProducts(selectedProducts.map(item => 
      item.productId === productId 
        ? { ...item, quantity: numQuantity } 
        : item
    ));
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(item => item.productId !== productId));
  };

  const handleCloseSupply = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один товар');
      return;
    }    if (selectedProducts.some(item => {
      const isWeightCategory = item.product.category?.name === 'На развес';
      if (isWeightCategory) {
        return item.quantity <= 0 || !Number.isFinite(item.quantity);
      }
      return item.quantity <= 0 || !Number.isInteger(item.quantity);
    })) {
      Alert.alert('Ошибка', 'Укажите корректное количество для всех товаров');
      return;
    }

    try {
      await api.post('/supplies', {
        items: selectedProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
      
      Alert.alert('Успех', 'Поставка успешно создана', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось создать поставку');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Поиск товаров */}
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск товаров..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Список выбранных товаров */}
      <View style={styles.selectedProductsContainer}>
        <Text style={styles.sectionTitle}>Выбранные товары:</Text>
        <FlatList
          data={selectedProducts}
          keyExtractor={item => item.productId.toString()}
          renderItem={({ item }) => (
            <View style={styles.selectedProductItem}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <View style={styles.quantityContainer}>                <TextInput
                  style={styles.quantityInput}
                  keyboardType={item.product.category?.name === 'На развес' ? 'decimal-pad' : 'numeric'}
                  value={item.quantity.toString()}
                  onChangeText={(value) => handleUpdateQuantity(item.productId, value)}
                  placeholder={`0 ${item.product.category?.name === 'На развес' ? 'кг' : 'шт.'}`}
                />
                <TouchableOpacity
                  onPress={() => handleRemoveProduct(item.productId)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={24} color="#FF0000" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет выбранных товаров</Text>
          }
        />
      </View>

      {/* Список доступных товаров */}
      <View style={styles.availableProductsContainer}>
        <Text style={styles.sectionTitle}>Доступные товары:</Text>
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productItem}
              onPress={() => handleAddProduct(item)}
            >
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Ionicons name="add-circle" size={24} color="#2196F3" />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Кнопка закрытия поставки */}
      <TouchableOpacity
        style={[
          styles.closeSupplyButton,
          selectedProducts.length === 0 && styles.closeSupplyButtonDisabled
        ]}
        onPress={handleCloseSupply}
        disabled={selectedProducts.length === 0}
      >
        <Text style={styles.closeSupplyButtonText}>
          Закрыть поставку
        </Text>
      </TouchableOpacity>
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  selectedProductsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  availableProductsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  productName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    width: 60,
    marginRight: 8,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  closeSupplyButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeSupplyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  closeSupplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
