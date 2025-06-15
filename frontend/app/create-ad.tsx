import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../constants/Roles';
import { decodeToken } from './utils/tokenUtils';
import { styles } from './styles/CreateAdScreenStyles';

export default function CreateAdScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {          const tokenData = decodeToken(token);
          if (!tokenData) {
            throw new Error('Invalid token data');
          }
          const staff = [
            UserRole.ADMIN,
            UserRole.SELLER,
            UserRole.ACCOUNTANT,
            UserRole.LOADER,
          ].includes(tokenData.role);
          if (staff) {
            router.back();
          }
        } catch {}
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() || !phone.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/ads', { text, phone });
      Alert.alert('Успешно', 'Ваше объявление отправлено на модерацию', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || 'Не удалось создать объявление'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Создать объявление</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Текст объявления</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Введите текст объявления"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Контактный телефон</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+7 (XXX) XXX-XX-XX"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Создать объявление</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

