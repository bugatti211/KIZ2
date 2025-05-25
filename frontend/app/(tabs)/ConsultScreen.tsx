import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getContacts } from '../authApi';

export default function ConsultScreen() {
  const [activeTab, setActiveTab] = useState('employee');
  const [contacts, setContacts] = useState({ telegram: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsData = await getContacts();
      setContacts(contactsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить контактные данные');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    if (contacts.telegram) {
      Linking.openURL(`https://t.me/${contacts.telegram}`);
    }
  };

  const openWhatsApp = () => {
    if (contacts.whatsapp) {
      Linking.openURL(`https://wa.me/${contacts.whatsapp}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'employee':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>Связаться с сотрудником</Text>
            {loading ? (
              <Text>Загрузка контактов...</Text>
            ) : (
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#0088cc' }]}
                  onPress={openTelegram}
                >
                  <FontAwesome name="telegram" size={24} color="white" />
                  <Text style={styles.buttonText}>Telegram</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                  onPress={openWhatsApp}
                >
                  <FontAwesome name="whatsapp" size={24} color="white" />
                  <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case 'ai':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>AI помощник</Text>
            {/* Здесь будет интерфейс AI помощника */}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'employee' && styles.activeTab
          ]}
          onPress={() => setActiveTab('employee')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'employee' && styles.activeTabText
          ]}>Сотрудник</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ai' && styles.activeTab
          ]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'ai' && styles.activeTabText
          ]}>AI помощник</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentText: {
    fontSize: 18,
    color: '#333',
  },
  contactButtons: {
    marginTop: 20,
    gap: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: 200,
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
