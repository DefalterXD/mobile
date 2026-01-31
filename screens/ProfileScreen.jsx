import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ onLogout }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      if (user) {
        setUserData(JSON.parse(user));
      }
    } catch (e) {
      console.error("Ошибка загрузки данных:", e);
    }
  };

  const executeLogout = async () => {
    try {
      // 1. Очищаем локальное хранилище
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken'); // если используете токены
      
      // 2. Уведомляем App.js, чтобы переключить на экран логина
      if (onLogout) {
        onLogout();
      }
    } catch (e) {
      console.error("Ошибка при удалении данных:", e);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // В вебе Alert.alert работает не всегда красиво, используем confirm
      if (window.confirm('Вы уверены, что хотите выйти?')) {
        executeLogout();
      }
    } else {
      // Для iOS/Android оставляем нативный Alert
      Alert.alert('Выход', 'Вы уверены?', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: executeLogout }
      ]);
    }
  };

  if (!userData) {
    return (
      <View style={styles.centerContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {userData?.first_name?.[0]}{userData?.last_name?.[0]}
          </Text>
        </View>
        <Text style={styles.userName}>
          {userData?.first_name} {userData?.last_name}
        </Text>
        <Text style={styles.userEmail}>{userData?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        
        {userData?.university && (
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={24} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Университет</Text>
              <Text style={styles.infoValue}>{userData.university}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>
      </View>

      {/* Кнопка выхода */}
      <TouchableOpacity 
        style={[styles.logoutButton, Platform.OS === 'web' && { cursor: 'pointer' }]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: 'white', alignItems: 'center', padding: 30, marginBottom: 10 },
  avatarLarge: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  avatarLargeText: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  userEmail: { fontSize: 16, color: '#666' },
  section: { backgroundColor: 'white', marginBottom: 10, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoContent: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#333' },
  logoutButton: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 15, 
    margin: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    justifyContent: 'center',
    // Тень для веба и мобилки
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { 
    marginLeft: 10, 
    fontSize: 16, 
    color: '#F44336', 
    fontWeight: 'bold' 
  },
});