import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { styles } from '../styles/RegisterScreenStyles';
import { register } from '../authApi';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный email');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      Alert.alert(
        'Успех',
        'Регистрация завершена! Теперь вы можете войти в систему.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Очищаем поля формы
              setName('');
              setEmail('');
              setPassword('');
              // Переходим на экран входа
              navigation.navigate('/(auth)/login');
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <TextInput
          placeholder="Имя"
          value={name}
          onChangeText={setName}
          style={[styles.input, { marginBottom: 14 }]}
          placeholderTextColor="#bfc6d1"
        />
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
        <Button title={loading ? 'Регистрация...' : 'Зарегистрироваться'} onPress={handleRegister} disabled={loading} />
      </View>
    </View>
  );
}
