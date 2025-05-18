import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ActivityIndicator, AppState, Button, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NavigationContainer } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import TabLayout from './(tabs)/_layout';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [globalLogoutFlag, setGlobalLogoutFlag] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Глобальный слушатель события logout через AppState
    const logoutListener = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) setGlobalLogoutFlag(true);
    };
    const subscription = AppState.addEventListener('change', logoutListener);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
      setIsAuthChecked(true);
      setShowAuthModal(!token);
    })();
  }, []);

  // Глобальный logout (например, при истечении токена)
  useEffect(() => {
    if (!isAuthenticated) setShowAuthModal(true);
  }, [isAuthenticated]);

  if (!loaded || !isAuthChecked) {
    return null;
  }

  return (
    <>
      <RootLayoutNav />
      <Modal visible={showAuthModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, paddingVertical: 32, paddingHorizontal: 20, width: '92%', maxWidth: 370, minHeight: 420, justifyContent: 'flex-start', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 18 }}>
            <TouchableOpacity
              onPress={() => setShowAuthModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              accessibilityLabel="Закрыть модальное окно"
            >
              <Ionicons name="close" size={28} color="#888" />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 32, textAlign: 'center', marginTop: 8, color: '#222' }}>
              {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
            </Text>
            <View style={{ width: '100%', flex: 1, justifyContent: 'flex-start' }}>
              {authMode === 'login' ? (
                <>
                  <LoginScreen navigation={{
                    replace: async () => {
                      setShowAuthModal(false);
                      setIsAuthenticated(true);
                    },
                    navigate: () => setAuthMode('register')
                  }} />
                  <TouchableOpacity onPress={() => setAuthMode('register')} style={{ marginTop: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#007AFF', fontSize: 16 }}>Нет аккаунта? Зарегистрироваться</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <RegisterScreen navigation={{
                    replace: () => setAuthMode('login'),
                    navigate: () => setAuthMode('login')
                  }} />
                  <TouchableOpacity onPress={() => setAuthMode('login')} style={{ marginTop: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#007AFF', fontSize: 16 }}>Уже есть аккаунт? Войти</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
