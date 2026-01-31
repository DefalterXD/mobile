// mobile/screens/landlord/PropertiesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertiesAPI } from '../../api';

export default function PropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getMyProperties();
      setProperties(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.property_id })}
    >
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{item.address}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.available_rooms > 0 ? '✓ Активен' : '○ Заполнен'}
          </Text>
        </View>
      </View>

      <View style={styles.propertyInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.district}, {item.city}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="home-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.property_type}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.total_rooms_count || 0}</Text>
          <Text style={styles.statLabel}>Комнат</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{item.available_rooms || 0}</Text>
          <Text style={styles.statLabel}>Свободно</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF6B35' }]}>{item.active_contracts || 0}</Text>
          <Text style={styles.statLabel}>Арендуется</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.property_id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Нет объектов</Text>
            <Text style={styles.emptyHint}>Добавьте свой первый объект</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Text style={styles.addButtonText}>+ Добавить объект</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {properties.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, flexGrow: 1 },
  propertyCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  propertyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10
  },
  propertyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  statusBadge: { 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12 
  },
  statusText: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold' },
  propertyInfo: { marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  infoText: { marginLeft: 5, fontSize: 14, color: '#666' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  statLabel: { fontSize: 12, color: '#999' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 20, color: '#999', marginTop: 15, fontWeight: 'bold' },
  emptyHint: { fontSize: 14, color: '#ccc', marginTop: 5 },
  addButton: { 
    backgroundColor: '#FF6B35', 
    paddingHorizontal: 30, 
    paddingVertical: 12, 
    borderRadius: 25,
    marginTop: 20
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  fab: { 
    position: 'absolute', 
    right: 20, 
    bottom: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FF6B35', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});