import React, { useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_EVENTS } from '../events';
import { Ionicons } from '@expo/vector-icons';
import CatalogScreen from './CatalogScreen';
import ConsultScreen from './ConsultScreen';
import CartScreen from './CartScreen';
import ProfileScreen from './ProfileScreen';
import CategoryProductsScreen from './CategoryProductsScreen';
import ProductCardScreen from './ProductCardScreen';
import ProductManagementScreen from './ProductManagementScreen';
import AddEditProductScreen from '../AddEditProductScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdsScreen from './AdsScreen';
import NewSupplyScreen from './NewSupplyScreen';
import SupplyHistoryScreen from './SupplyHistoryScreen';
import OrdersScreen from './OrdersScreen';
import OfflineSalesScreen from './OfflineSalesScreen';
import SalesHistoryScreen from './SalesHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Функция для проверки авторизации
const checkAuth = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Профиль', headerShown: true }}/>
      <Stack.Screen 
        name="OfflineSalesScreen" 
        component={OfflineSalesScreen} 
        options={{ 
          title: 'Оффлайн-продажи',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }} 
      />
      <Stack.Screen 
        name="ProductManagementScreen" 
        component={ProductManagementScreen} 
        options={{ 
          title: 'Управление товарами',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }} 
      />
      <Stack.Screen 
        name="NewSupply" 
        component={NewSupplyScreen} 
        options={{ 
          title: 'Новая поставка',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }} 
      />
      <Stack.Screen
        name="SupplyHistory"
        component={SupplyHistoryScreen}
        options={{
          title: 'История поставок',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      />
      <Stack.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{
          title: 'История продаж',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      />
      <Stack.Screen
        name="AddEditProductScreen"
        component={AddEditProductScreen}
        options={({ route }: any) => ({
          title: route.params?.product ? 'Редактировать товар' : 'Новый товар',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        })} 
      />
    </Stack.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CatalogMain" component={CatalogScreen} options={{ title: 'Каталог' }} />
      <Stack.Screen 
        name="CategoryProductsScreen" 
        component={CategoryProductsScreen} 
        options={({ route }: any) => ({ 
          title: route.params?.category || 'Товары категории',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })} 
      />
      <Stack.Screen 
        name="ProductCardScreen" 
        component={ProductCardScreen} 
        options={({ route }: any) => ({ 
          title: route.params?.product?.name || 'Товар',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        })} 
      />
    </Stack.Navigator>
  );
}

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const checkAdminStatus = useCallback(async () => {
    try {
      const currentToken = await AsyncStorage.getItem('token');
      setToken(currentToken);
      setIsAuthenticated(!!currentToken);
      
      if (currentToken) {
        try {
          const tokenData = JSON.parse(atob(currentToken.split('.')[1]));
          setIsAdmin(tokenData.role === 'admin');
          setIsSeller(tokenData.role === 'seller');
          setIsLoader(tokenData.role === 'loader');
          setIsStaff(['admin', 'seller', 'accountant', 'loader'].includes(tokenData.role));
        } catch (e) {
          console.error('Error parsing token:', e);          setIsAdmin(false);
          setIsSeller(false);
          setIsLoader(false);
          setIsStaff(false);
        }
      } else {
        setIsAdmin(false);
        setIsSeller(false);
        setIsLoader(false);
        setIsStaff(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
    authEvents.on(AUTH_EVENTS.TOKEN_CHANGE, checkAdminStatus);
    return () => {
      authEvents.off(AUTH_EVENTS.TOKEN_CHANGE, checkAdminStatus);
    };
  }, [checkAdminStatus]);

  return (
    <Tab.Navigator 
      initialRouteName="AdsScreen"
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
      }}>
      {/* Screens */}
      <Tab.Screen
        name="AdsScreen"
        component={AdsScreen}
        options={{
          title: 'Объявления',
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="catalog"
        component={CatalogStack}
        options={{
          title: 'Каталог',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="consult"
        component={ConsultScreen}
        options={{
          title: 'Консультант',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
        }}
      />
      {!isStaff && (
        <Tab.Screen
          name="cart"
          component={CartScreen}
          options={{
            title: 'Корзина',
            tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          }}        />
      )}
      {(isAdmin || isSeller || isLoader) && (
        <Tab.Screen
          name="orders"
          component={OrdersScreen}
          options={{
            title: 'Заказы',
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="profile"
        component={ProfileStack}
        options={{
          title: isAuthenticated ? 'Профиль' : 'Войти',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function getTabTitle(name: string) {
  switch (name) {
    case 'Catalog': return 'Каталог';
    case 'Consult': return 'Консультация';
    case 'Cart': return 'Корзина';
    case 'Profile': return 'Профиль';
    case 'Ads': return 'Объявления';
    case 'Orders': return 'Заказы';
    default: return '';
  }
}
