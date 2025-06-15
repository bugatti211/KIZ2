import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles/CatalogContentStyles';
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


export default CatalogContent;

