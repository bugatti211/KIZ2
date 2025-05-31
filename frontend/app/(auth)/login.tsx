import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../authApi';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      await AsyncStorage.setItem('token', data.token);
      Alert.alert('Успех', 'Вход выполнен!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/AdsScreen');
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 0, backgroundColor: 'transparent' }}>
      <View style={{ width: 320, backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, elevation: 8, alignItems: 'stretch' }}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1.5, marginBottom: 14, padding: 10, borderRadius: 7, fontSize: 18, backgroundColor: '#f8f9fb', borderColor: '#d1d5db' }}
          placeholderTextColor="#bfc6d1"
        />
        <TextInput
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1.5, marginBottom: 20, padding: 10, borderRadius: 7, fontSize: 18, backgroundColor: '#f8f9fb', borderColor: '#d1d5db' }}
          placeholderTextColor="#bfc6d1"
        />
        <Button title={loading ? 'Вход...' : 'Войти'} onPress={handleLogin} disabled={loading} />
      </View>
    </View>
  );
}
