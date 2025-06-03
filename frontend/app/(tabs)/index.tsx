import { Redirect } from 'expo-router';

export default function TabIndexScreen() {
  // Redirect to the Ads screen by default
  return <Redirect href="/(tabs)/AdsScreen" />;
}
