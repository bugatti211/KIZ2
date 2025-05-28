import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CatalogScreen from './CatalogScreen';
import ConsultScreen from './ConsultScreen';
import CartScreen from './CartScreen';
import ProfileScreen from './ProfileScreen';
import CategoryProductsScreen from './CategoryProductsScreen';
import ProductCardScreen from './ProductCardScreen';
import ProductManagementScreen from './ProductManagementScreen';
import AddEditProductScreen from './AddEditProductScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdsScreen from './AdsScreen';
import NewSupplyScreen from './NewSupplyScreen';
import SupplyHistoryScreen from './SupplyHistoryScreen';
import OrdersScreen from './OrdersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Профиль', headerShown: true }}/>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CatalogMain" component={CatalogScreen} options={{ title: 'Каталог', headerShown: true }} />
      <Stack.Screen 
        name="CategoryProductsScreen" 
        component={CategoryProductsScreen} 
        options={({ route }: any) => ({ 
          title: route.params?.category || 'Товары категории',
          headerShown: true,
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

export default function TabLayout({ setIsAuthenticated }: any) {
  return (
    <Tab.Navigator
      initialRouteName="Ads"
      screenOptions={({ route }) => ({
        headerShown: route.name !== 'Catalog' && route.name !== 'Profile', // Show headers except for stacks
        title: getTabTitle(route.name),
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Ads': iconName = 'megaphone-outline'; break;
            case 'Catalog': iconName = 'list-outline'; break;
            case 'Consult': iconName = 'chatbubble-ellipses-outline'; break;
            case 'Cart': iconName = 'cart-outline'; break;
            case 'Profile': iconName = 'person-outline'; break;
            case 'Orders': iconName = 'receipt-outline'; break;
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ads" component={AdsScreen} options={{ title: 'Объявления' }} />
      <Tab.Screen name="Catalog" component={CatalogStack} options={{ title: 'Каталог' }} />
      <Tab.Screen name="Consult" component={ConsultScreen} options={{ title: 'Консультация' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Корзина' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Заказы' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
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
