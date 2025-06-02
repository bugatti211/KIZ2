import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { styles } from '../styles/AdsScreenStyles';
import { useRouter } from 'expo-router';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  authMode: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, authMode }) => {
  const router = useRouter();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>
          
          <TouchableOpacity 
            onPress={() => {
              onClose();
              router.push("/(auth)/login");
            }}
            style={styles.authButton}
          >
            <Text style={styles.authButtonText}>Войти</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              onClose();
              router.push("/(auth)/register");
            }}
            style={[styles.authButton, styles.registerButton]}
          >
            <Text style={styles.authButtonText}>Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
