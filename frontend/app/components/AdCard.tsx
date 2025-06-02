import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ad } from '../types/ad.types';
import { styles } from '../styles/AdsScreenStyles';

interface AdCardProps {
  item: Ad;
  isAdmin: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ 
  item, 
  isAdmin, 
  onApprove, 
  onReject, 
  onDelete 
}) => {
  return (
    <View style={styles.adCard}>
      <Text style={styles.adText}>{item.text}</Text>
      <Text style={styles.adPhone}>{item.phone}</Text>
      {isAdmin && (
        <View style={styles.moderationButtons}>
          {item.status === 'pending' ? (
            <>
              <TouchableOpacity
                style={[styles.moderationButton, styles.approveButton]}
                onPress={() => onApprove(item.id)}
              >
                <Text style={styles.buttonText}>Подтвердить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moderationButton, styles.rejectButton]}
                onPress={() => onReject(item.id)}
              >
                <Text style={styles.buttonText}>Отклонить</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Подтверждено</Text>
              <TouchableOpacity
                style={[styles.moderationButton, styles.deleteButton]}
                onPress={() => onDelete(item.id)}
              >
                <Text style={styles.buttonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {!isAdmin && item.status === 'approved' && (
        <Text style={styles.statusText}>Подтверждено</Text>
      )}
    </View>
  );
};
