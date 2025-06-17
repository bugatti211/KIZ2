import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { OrderStatus, getOrderStatusTranslation } from '../../constants/Orders';

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute() as any;
  const { order } = params || {};

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.goBack()} label="" />
      )
    });
  }, [navigation]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Данные заказа недоступны</Text>
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
      <Text style={styles.title}>Заказ №{order.id}</Text>
      <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      <Text style={styles.info}>Статус: {getOrderStatusTranslation(order.status)}</Text>
      <Text style={styles.date}>Обновлено: {formatDate(order.updatedAt)}</Text>
      <Text style={styles.info}>Клиент: {order.name}</Text>
      {order.deliveryMethod === 'Доставка' && (
        <Text style={styles.info}>Адрес: {order.address}</Text>
      )}
      <Text style={styles.info}>Оплата: {order.paymentMethod}</Text>
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Состав заказа:</Text>
        {order.items.map((item: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.quantity}>
              {item.quantity} {item.product.isByWeight ? 'кг' : 'шт'}
            </Text>
            <Text style={styles.price}>{Number(item.price).toLocaleString()} ₽</Text>
          </View>
        ))}
      </View>
      {order.comment ? (
        <Text style={styles.comment}>Комментарий: {order.comment}</Text>
      ) : null}
      <Text style={styles.total}>Итого: {Number(order.total).toLocaleString()} ₽</Text>
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
  info: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4
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
  comment: {
    marginTop: 12,
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
