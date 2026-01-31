// mobile/screens/landlord/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useIsFocused } from '@react-navigation/native'; // Добавлен импорт
import { Ionicons } from '@expo/vector-icons';
import { propertiesAPI } from '../../api';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // Следим за фокусом экрана

  const fetchStats = useCallback(async () => {
    // Не показываем ActivityIndicator при каждом фокусе, 
    // чтобы интерфейс не "прыгал", только при первой загрузке
    try {
      const response = await propertiesAPI.getMyProperties();
      const properties = response.data;
      
      const totalProperties = properties.length;
      const totalRooms = properties.reduce((sum, p) => sum + parseInt(p.total_rooms_count || 0), 0);
      const availableRooms = properties.reduce((sum, p) => sum + parseInt(p.available_rooms || 0), 0);
      const activeContracts = properties.reduce((sum, p) => sum + parseInt(p.active_contracts || 0), 0);
      
      setStats({
        totalProperties,
        totalRooms,
        availableRooms,
        occupiedRooms: totalRooms - availableRooms,
        activeContracts
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Вызываем fetchStats каждый раз, когда экран в фокусе
  useEffect(() => {
    if (isFocused) {
      fetchStats();
    }
  }, [isFocused, fetchStats]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Панель управления</Text>
        <Text style={styles.headerSubtitle}>Обзор вашего бизнеса</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#FF6B35' }]}>
          <Ionicons name="home" size={32} color="white" />
          <Text style={styles.statNumber}>{stats?.totalProperties || 0}</Text>
          <Text style={styles.statLabel}>Объектов</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
          <Ionicons name="bed" size={32} color="white" />
          <Text style={styles.statNumber}>{stats?.totalRooms || 0}</Text>
          <Text style={styles.statLabel}>Всего комнат</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#95E1D3' }]}>
          <Ionicons name="checkmark-circle" size={32} color="white" />
          <Text style={styles.statNumber}>{stats?.availableRooms || 0}</Text>
          <Text style={styles.statLabel}>Свободно</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F38181' }]}>
          <Ionicons name="people" size={32} color="white" />
          <Text style={styles.statNumber}>{stats?.occupiedRooms || 0}</Text>
          <Text style={styles.statLabel}>Занято</Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Properties', { 
            screen: 'AddProperty' 
          })}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add-circle" size={28} color="#FF6B35" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Добавить объект</Text>
            <Text style={styles.actionDescription}>Создать новый объект недвижимости</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Properties')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="list" size={28} color="#4ECDC4" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Мои объекты</Text>
            <Text style={styles.actionDescription}>Управление объектами и комнатами</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('ChatTab')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="chatbubbles" size={28} color="#95E1D3" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Сообщения</Text>
            <Text style={styles.actionDescription}>Чаты со студентами</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FF6B35', padding: 30, paddingTop: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 10,
    marginTop: -20
  },
  statCard: { 
    width: '47%', 
    margin: '1.5%',
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 10 },
  statLabel: { fontSize: 14, color: 'white', marginTop: 5 },
  actionsSection: { padding: 15, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  actionCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 3, color: '#333' },
  actionDescription: { fontSize: 14, color: '#666' },
});