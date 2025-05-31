import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
  '/(tabs)': {
    initialRouteName: 'index',
  },
  '/(auth)': {
    initialRouteName: 'login',
  }
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
