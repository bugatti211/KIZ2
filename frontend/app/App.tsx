import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppLayout from './_layout';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

export default function App() {
  useEffect(() => {
    LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppLayout />
    </GestureHandlerRootView>
  );
}
