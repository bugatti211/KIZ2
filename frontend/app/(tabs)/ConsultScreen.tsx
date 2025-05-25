import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ConsultScreen() {
  const [activeTab, setActiveTab] = useState('employee');

  const renderContent = () => {
    switch (activeTab) {
      case 'employee':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>Связаться с сотрудником</Text>
            {/* Здесь будет форма для связи с сотрудником */}
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
});
