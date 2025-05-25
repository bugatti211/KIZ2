import React, { useEffect } from 'react';
import { View, Text, Image, Button, ScrollView, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';

export default function ProductCardScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore
  const { product } = route.params || {};

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

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ошибка: информация о товаре не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Картинка товара */}
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.image} 
          resizeMode="cover"
        />

        {/* Основная информация */}
        <View style={styles.mainInfo}>          <Text style={styles.price}>{product.price.toLocaleString()} ₽</Text>          <Text style={styles.stockInfo} numberOfLines={1}>
            {product.stock > 0 
              ? <Text style={{ color: '#388e3c' }}>
                  ● В наличии: {product.stock} {product.category?.name === 'На развес' ? 'кг' : 'шт.'}
                </Text>
              : <Text style={{ color: '#d11a2a' }}>× Нет в наличии</Text>
            }
          </Text>
        </View>

        {/* Описание */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Рекомендации по применению */}
        {product.recommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Рекомендации по применению</Text>
            <Text style={styles.recommendations}>{product.recommendations}</Text>
          </View>
        )}

        {/* Кнопка купить */}
        <View style={styles.buttonContainer}>
          <Button 
            title="Купить" 
            color="#4caf50"
            disabled={product.stock <= 0}
            onPress={() => {}}
          />
        </View>
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
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  stockInfo: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  recommendations: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 8,
  },
});