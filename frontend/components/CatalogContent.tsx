import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  active: boolean;
}

interface Props {
  isSearching: boolean;
  error: string;
  filteredProducts: Product[];
  filteredCategories: Category[];
  categories: Category[];
  isAdmin: boolean;
  navigation: any;
  handleDeleteCategory: (id: string) => void;
}

const CatalogContent: React.FC<Props> = ({
  isSearching,
  error,
  filteredProducts,
  filteredCategories,
  categories,
  isAdmin,
  navigation,
  handleDeleteCategory,
}) => {
  if (isSearching) {
    return (
      <ScrollView>
        {filteredProducts.length === 0 ? (
          <Text style={styles.emptyText}>Товары не найдены</Text>
        ) : (
          filteredProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productBlock}
              onPress={() => navigation.navigate('ProductCardScreen', { product })}
            >
              <View style={styles.productContent}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.categoryLabel}>
                  {categories.find(c => c.id === product.categoryId)?.name || ''}
                </Text>
                {product.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                )}
                <Text style={styles.productPrice}>{product.price} ₽</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      {filteredCategories.length === 0 && !error ? (
        <Text style={styles.emptyText}>Нет доступных категорий</Text>
      ) : (
        filteredCategories.map((category) => (
          <TouchableOpacity 
            key={category.id} 
            style={styles.categoryBlock}
            onPress={() => navigation.navigate('CategoryProductsScreen', {
              categoryId: category.id,
              category: category.name
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.categoryText}>{category.name}</Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  categoryBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  productBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
});

export default CatalogContent;
