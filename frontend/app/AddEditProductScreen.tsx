import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { Product } from './models/product.model';
import api from './api';

interface Category {
  id: number;
  name: string;
}

type RootStackParamList = {
  AddEditProductScreen: { product?: Product };
  ProductManagementScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddEditProductScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const editProduct = route.params?.product as Product | undefined;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form state
  const [name, setName] = useState(editProduct?.name || '');
  const [category, setCategory] = useState<number>(editProduct?.categoryId || 0);
  const [description, setDescription] = useState(editProduct?.description || '');
  const [recommendations, setRecommendations] = useState(editProduct?.recommendations || '');
  const [price, setPrice] = useState(editProduct?.price?.toString() || '');
  const [stock, setStock] = useState(editProduct?.stock?.toString() || '0');
  const [active, setActive] = useState(editProduct?.active ?? true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      if (!category && response.data.length > 0) {
        setCategory(response.data[0].id);
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название товара');
      return false;
    }    if (category === 0) {
      Alert.alert('Ошибка', 'Выберите категорию');
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Ошибка', 'Введите корректную цену');
      return false;
    }
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) {
      Alert.alert('Ошибка', 'Введите корректное количество');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const productData = {
        name,
        categoryId: category,
        description,
        recommendations,
        price: Number(price),
        stock: Number(stock),
        active
      };

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }

      Alert.alert(
        'Успех',
        editProduct ? 'Товар обновлен' : 'Товар добавлен',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert(
        'Ошибка',
        editProduct ? 'Не удалось обновить товар' : 'Не удалось добавить товар'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Название*</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Введите название товара"
        />

        <Text style={styles.label}>Категория*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(value: number) => setCategory(value)}
            style={{ height: 50 }}
          >
            {categories.map((cat) => (
              <Picker.Item 
                key={cat.id} 
                label={cat.name} 
                value={cat.id} 
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Введите описание товара"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Рекомендации</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={recommendations}
          onChangeText={setRecommendations}
          placeholder="Введите рекомендации по использованию"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Цена (₽)*</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="Введите цену"
        />

        <Text style={styles.label}>Количество*</Text>
        <TextInput
          style={styles.input}
          value={stock}
          onChangeText={setStock}
          keyboardType="decimal-pad"
          placeholder="Введите количество"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Активный</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={active ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddEditProductScreen;