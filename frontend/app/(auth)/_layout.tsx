import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#000',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerShown: true
    }}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Вход'
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Регистрация',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack>
  );
}
