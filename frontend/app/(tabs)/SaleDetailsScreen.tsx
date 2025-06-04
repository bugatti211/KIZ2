import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';

export default function SaleDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute() as any;
  const { sale } = params || {};

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.goBack()} label="" />
      )
    });
  }, [navigation]);

  if (!sale) {
    return (
      <View style={styles.container}>
        <Text>Данные продажи недоступны</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Продажа №{sale.id}</Text>
      <Text style={styles.date}>{formatDate(sale.date)}</Text>
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Состав продажи:</Text>
        {sale.items.map((item: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.quantity}>
              {item.quantity} {item.product.category?.name === 'На развес' ? 'кг' : 'шт'}
            </Text>
            <Text style={styles.price}>{Number(item.price).toLocaleString()} ₽</Text>
          </View>
        ))}
      </View>
      <Text style={styles.total}>Итого: {Number(sale.total).toLocaleString()} ₽</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  itemsContainer: {
    marginTop: 12,
    marginBottom: 12
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  itemName: {
    flex: 1,
    color: '#333'
  },
  quantity: {
    width: 60,
    textAlign: 'right',
    color: '#666'
  },
  price: {
    width: 80,
    textAlign: 'right',
    color: '#333'
  },
  total: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333'
  }
});
