import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import api from '../api';
import { Product, CreateProductDto } from '../models/product.model';

interface Category {
  id: number;
  name: string;
}

export default function AddEditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // @ts-ignore
  const editingProduct: Product | undefined = route.params?.product;
  const [name, setName] = useState(editingProduct?.name || '');
  const [categoryId, setCategoryId] = useState<number | null>(editingProduct?.categoryId || null);
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [recommendations, setRecommendations] = useState(editingProduct?.recommendations || '');
  const [price, setPrice] = useState(editingProduct?.price?.toString() || '');
  const [stock, setStock] = useState(editingProduct?.stock?.toString() || '0');
  const [active, setActive] = useState(editingProduct?.active ?? true);  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [priceError, setPriceError] = useState('');
  const [stockError, setStockError] = useState('');

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

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.get('/categories');
      setCategories(res.data);
      if (!categoryId && res.data.length > 0) {
        setCategoryId(res.data[0].id);
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };

  const validatePrice = (value: string) => {
    if (!value.trim()) {
      setPriceError('Цена обязательна');
      return false;
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      setPriceError('Введите положительное число');
      return false;
    }
    setPriceError('');
    return true;
  };  const validateStock = (value: string) => {
    if (!value.trim()) {
      setStockError('Количество обязательно');
      return false;
    }
    
    // Заменяем запятую на точку для корректной обработки
    const normalizedValue = value.replace(',', '.');
    const numValue = Number(normalizedValue);
    
    if (isNaN(numValue) || numValue < 0) {
      setStockError('Введите неотрицательное число');
      return false;
    }
    
    const isWeightCategory = categories.find(c => c.id === categoryId)?.name === 'На развес';
    if (isWeightCategory) {
      // Для весовых товаров - проверка на 2 знака после запятой
      const decimalParts = normalizedValue.split('.');
      if (!Number.isFinite(numValue) || (decimalParts.length > 1 && decimalParts[1].length > 2)) {
        setStockError('Введите число с не более чем 2 знаками после запятой');
        return false;
      }
    } else {
      // Для штучных товаров - только целые числа
      if (!Number.isInteger(numValue)) {
        setStockError('Введите целое число для штучного товара');
        return false;
      }
    }
    
    setStockError('');
    return true;
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    validatePrice(value);
  };

  const handleStockChange = (value: string) => {
    setStock(value);
    validateStock(value);
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля: название и категория');
      return;
    }

    if (!validatePrice(price) || !validateStock(stock)) {
      return;
    }

    setSaving(true);
    try {    // If product is in "Поставки новые" category, force active to false
    const isNewSupplyCategory = categories.find(c => c.id === categoryId)?.name === 'Поставки новые';    const productData: CreateProductDto = {
      name: name.trim(),
      categoryId,
      description: description.trim(),
      recommendations: recommendations.trim(),      price: Number(price),
      stock: Number(stock.replace(',', '.')),
      active: isNewSupplyCategory ? false : active
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }

      navigation.goBack();    } catch (e: any) {
      const errorMessage = e.response?.data?.error || e.message || 'Не удалось сохранить товар';
      Alert.alert('Ошибка', errorMessage);
      console.error('Error creating product:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Название товара*</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Введите название товара"
          maxLength={50}
        />

        <Text style={styles.label}>Категория*</Text>
        {loadingCategories ? (
          <ActivityIndicator style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView 
            horizontal 
            style={styles.categoriesContainer} 
            showsHorizontalScrollIndicator={false}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}                style={[
                  styles.categoryButton,
                  categoryId === category.id && styles.categoryButtonActive
                ]}
                onPress={() => {
                  setCategoryId(category.id);
                  if (category.name === 'Поставки новые') {
                    setActive(false);
                  }
                }}
              >
                <Text style={[
                  styles.categoryButtonText,
                  categoryId === category.id && styles.categoryButtonTextActive
                ]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Описание</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          placeholder="Введите описание товара"
          multiline
          numberOfLines={4}
          maxLength={200}
        />

        <Text style={styles.label}>Рекомендации по применению</Text>
        <TextInput
          value={recommendations}
          onChangeText={setRecommendations}
          style={[styles.input, styles.textArea]}
          placeholder="Введите рекомендации по применению"
          multiline
          numberOfLines={4}
          maxLength={200}
        />

        <Text style={styles.label}>Цена (₽)*</Text>
        <TextInput
          value={price}
          onChangeText={handlePriceChange}
          style={[styles.input, priceError ? styles.inputError : null]}
          placeholder="Введите цену"
          keyboardType="numeric"
        />
        {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}        <Text style={styles.label}>
          {`Количество в наличии${categories.find(c => c.id === categoryId)?.name === 'На развес' ? ' (кг)' : ' (шт)'}`}*
        </Text>
        <TextInput
          value={stock}
          onChangeText={handleStockChange}
          style={[styles.input, stockError ? styles.inputError : null]}
          placeholder={`Введите количество${categories.find(c => c.id === categoryId)?.name === 'На развес' ? ' в килограммах' : ' штук'}`}
          keyboardType={categories.find(c => c.id === categoryId)?.name === 'На развес' ? 'decimal-pad' : 'numeric'}
        />
        {stockError ? <Text style={styles.errorText}>{stockError}</Text> : null}        <View style={styles.switchContainer}>
          <Text style={styles.label}>Активен</Text>
          <Switch
            value={active}
            onValueChange={(newValue) => {
              const isNewSupplyCategory = categories.find(c => c.id === categoryId)?.name === 'Поставки новые';
              if (isNewSupplyCategory) {
                Alert.alert('Внимание', 'Нельзя изменить статус товара из категории "Поставки новые"');
                return;
              }
              setActive(newValue);
            }}
            disabled={categories.find(c => c.id === categoryId)?.name === 'Поставки новые'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={active ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Сохранение...' : (editingProduct ? 'Сохранить' : 'Создать')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
});
