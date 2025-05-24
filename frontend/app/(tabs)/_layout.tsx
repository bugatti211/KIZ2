import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdsScreen from './index';
import CatalogScreen from './CatalogScreen';
import ConsultScreen from './ConsultScreen';
import CartScreen from './CartScreen';
import ProfileScreen from './ProfileScreen';
import CategoryProductsScreen from './CategoryProductsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CatalogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CatalogMain" component={CatalogScreen} options={{ title: 'Каталог' }} />
      <Stack.Screen name="CategoryProductsScreen" component={CategoryProductsScreen} options={{ title: 'Товары категории' }} />
    </Stack.Navigator>
  );
}

export default function TabLayout({ setIsAuthenticated }: any) {
  return (
    <Tab.Navigator
      initialRouteName="Ads"
      screenOptions={({ route }) => ({
        headerShown: true,
        title: getTabTitle(route.name),
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Ads': iconName = 'megaphone-outline'; break;
            case 'Catalog': iconName = 'list-outline'; break;
            case 'Consult': iconName = 'chatbubble-ellipses-outline'; break;
            case 'Cart': iconName = 'cart-outline'; break;
            case 'Profile': iconName = 'person-outline'; break;
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ads" component={AdsScreen} options={{ title: 'Объявления' }} />
      <Tab.Screen name="Catalog" component={CatalogStack} options={{ title: 'Каталог' }} />
      <Tab.Screen name="Consult" component={ConsultScreen} options={{ title: 'Консультация' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Корзина' }} />
      <Tab.Screen name="Profile" options={{ title: 'Профиль' }}>
        {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function getTabTitle(name: string) {
  switch (name) {
    case 'Ads': return 'Объявления';
    case 'Catalog': return 'Каталог';
    case 'Consult': return 'Консультация';
    case 'Cart': return 'Корзина';
    case 'Profile': return 'Профиль';
    default: return '';
  }
}
