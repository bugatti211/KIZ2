import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '../styles/AdsScreenStyles';
import { useAds, useAuth } from '../hooks/useAds';
import { AdCard } from '../components/AdCard';
import { AuthModal } from '../components/AuthModal';

export default function AdsScreen() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const isFocused = useIsFocused();
  
  const { isAuthChecked, isAuthenticated, isAdmin } = useAuth();
  const { ads, loading, error, fetchAds, handleApprove, handleReject, handleDelete } = useAds(isAdmin, isAuthenticated);
  useEffect(() => {
    if (isAuthChecked) {
      fetchAds();
    }
  }, [isAdmin, isAuthChecked, isFocused]);

  if (!isAuthChecked) return null;

  const handleCreateAd = () => {
    router.push('/(auth)/login');
    setShowAuth(false);
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id.toString()}          renderItem={({ item }) => (
            <AdCard
              item={item}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          if (!isAuthenticated) {
            setShowAuth(true);
          } else {
            router.push('/create-ad');
          }
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        authMode={authMode}
      />
    </View>
  );
}
