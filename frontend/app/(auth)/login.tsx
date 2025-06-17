import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { styles } from '../styles/LoginScreenStyles';
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
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { marginBottom: 14 }]}
          placeholderTextColor="#bfc6d1"
        />
        <TextInput
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { marginBottom: 20 }]}
          placeholderTextColor="#bfc6d1"
        />
        <Button title={loading ? 'Вход...' : 'Войти'} onPress={handleLogin} disabled={loading} />
      </View>
    </View>
  );
}
