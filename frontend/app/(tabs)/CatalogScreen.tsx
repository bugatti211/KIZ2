import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Описываем параметры навигации для Stack
export type RootStackParamList = {
  CategoryProductsScreen: { category: string; categoryId: number };
  // ... другие экраны, если есть
};

export default function CatalogScreen() {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]); // теперь с id
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Загрузка категорий из backend
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (e) {
      // обработка ошибок
    }
  };

  // Добавление категории через backend
  const handleAddCategory = async () => {
    setSaving(true);
    try {
      await api.post('/categories', { name: categoryName });
      setCategoryName('');
      setShowAddCategory(false);
      await fetchCategories(); // всегда обновлять список после добавления
    } catch (e) {
      // обработка ошибок
    } finally {
      setSaving(false);
    }
  };

  // Удаление категории через backend
  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories(); // всегда обновлять список после удаления
    } catch (e) {
      // обработка ошибок
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Заголовок убран, чтобы не дублировать с навигацией */}
      <Button title="Добавить категорию" onPress={() => setShowAddCategory(true)} />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.categoryBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('CategoryProductsScreen', {
                    category: item.name,
                    categoryId: item.id,
                  });
                }}
                style={{ flex: 1 }}
              >
                <Text style={styles.categoryText}>{item.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} accessibilityLabel="Удалить категорию">
                <Ionicons name="trash-outline" size={22} color="#d11a2a" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        style={{ marginTop: 24 }}
      />
      <Modal visible={showAddCategory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новая категория</Text>
            <TextInput
              placeholder="Название категории"
              value={categoryName}
              onChangeText={setCategoryName}
              style={styles.input}
            />
            <Button title={saving ? 'Добавление...' : 'Добавить'} onPress={handleAddCategory} disabled={saving || !categoryName.trim()} />
            <View style={{ height: 8 }} />
            <Button title="Отмена" onPress={() => setShowAddCategory(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '92%',
    maxWidth: 400,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
  },
  categoryBlock: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  categoryText: {
    fontSize: 18,
    color: '#222',
  },
});
