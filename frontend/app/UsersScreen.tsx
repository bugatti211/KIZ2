import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import { getUsers } from './authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, roleTranslations } from '../constants/Roles';

export default function UsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => Alert.alert('Ошибка', 'Не удалось получить пользователей'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Выйти" onPress={handleLogout} />
      <Text style={{ fontSize: 24, marginVertical: 20 }}>Пользователи</Text>
      {loading ? (
        <Text>Загрузка...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <Text>{item.name} ({item.email})</Text>
              <Text style={{ color: 'gray' }}>{roleTranslations[item.role as UserRole]}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
