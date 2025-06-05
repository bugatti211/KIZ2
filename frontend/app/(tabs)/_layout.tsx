import React, { useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_EVENTS } from '../events';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserRole } from '../../constants/Roles';
import { decodeToken } from '../utils/tokenUtils';
import CatalogScreen from './CatalogScreen';
import ConsultScreen from './ConsultScreen';
import CartScreen from './CartScreen';
import ProfileScreen from './ProfileScreen';
import CategoryProductsScreen from './CategoryProductsScreen';
import ProductCardScreen from './ProductCardScreen';
import ProductManagementScreen from './ProductManagementScreen';
import AddEditProductScreen from '../AddEditProductScreen';
import AdsScreen from './AdsScreen';
import NewSupplyScreen from './NewSupplyScreen';
import SupplyHistoryScreen from './SupplyHistoryScreen';
import OrdersScreen from './OrdersScreen';
import MyOrdersScreen from './MyOrdersScreen';
import OfflineSalesScreen from './OfflineSalesScreen';
import SalesHistoryScreen from './SalesHistoryScreen';
import OrderDetailsScreen from './OrderDetailsScreen';
import SaleDetailsScreen from './SaleDetailsScreen';
import StaffManagementScreen from './StaffManagementScreen';
import SellerChatsScreen from './SellerChatsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
      <Stack.Screen 
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Профиль', headerShown: true }}
      />
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
          }        }}
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
        }}/>
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
          }        }}
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
        }}/>
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
        }}/>
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: 'Мои заказы',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: 'Детали заказа',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: 'bold' }        }}
      />
      <Stack.Screen
        name="SaleDetails"
        component={SaleDetailsScreen}
        options={{
          title: 'Детали продажи',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagementScreen}
        options={{
          title: 'Управление персоналом',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: 'bold' }        }}
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
      /></Stack.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CatalogMain"
        component={CatalogScreen}
        options={{ title: 'Каталог' }}
      /><Stack.Screen        name="CategoryProductsScreen"
        component={CategoryProductsScreen}
        options={({ route }: any) => ({
          title: route.params?.category || 'Товары категории',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
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
  const router = useRouter();
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
          const tokenData = decodeToken(currentToken);
          if (!tokenData) {
            throw new Error('Invalid token data');
          }
          setIsAdmin(tokenData.role === UserRole.ADMIN);
          setIsSeller(tokenData.role === UserRole.SELLER);
          setIsLoader(tokenData.role === UserRole.LOADER);
          setIsStaff([UserRole.ADMIN, UserRole.SELLER, UserRole.ACCOUNTANT, UserRole.LOADER].includes(tokenData.role));
        } catch (e) {
          console.error('Error parsing token:', e);
          setIsAdmin(false);
          setIsSeller(false);
          setIsLoader(false);
          setIsStaff(false);
          await AsyncStorage.removeItem('token');
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
      setIsSeller(false);
      setIsLoader(false);
      setIsStaff(false);
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
    <Tab.Navigator initialRouteName="AdsScreen" screenOptions={{
        tabBarActiveTintColor: '#007AFF',
      }}>
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
      {!isStaff && (
        <Tab.Screen
          name="consult"
          component={ConsultScreen}
          options={{
            title: 'Консультант',
            tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
          }}
        />
      )}
      {!isStaff && (
        <Tab.Screen
          name="cart"
          component={CartScreen}          options={{
            title: 'Корзина',
            tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          }}
        />
      )}
      {isSeller && (
        <Tab.Screen
          name="sellerChats"
          component={SellerChatsScreen}
          options={{
            title: 'Чаты',
            tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          }}
        />
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
        listeners={{
          tabPress: async (e) => {
            // Allow access to profile for all authenticated users
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              e.preventDefault();
              router.push('/(auth)/login');
            }
          },
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
    case 'sellerChats': return 'Чаты';
    default: return '';
  }
}
