// mobile/screens/landlord/PropertyDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertiesAPI } from '../../api';

export default function PropertyDetailScreen({ route, navigation }) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomArea: '',
    capacity: '1',
    pricePerMonth: '',
    amenities: ''
  });

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const response = await propertiesAPI.getById(propertyId);
      setProperty(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.pricePerMonth) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    try {
      await propertiesAPI.addRoom({
        propertyId,
        ...newRoom
      });
      
      setModalVisible(false);
      setNewRoom({
        roomNumber: '',
        roomArea: '',
        capacity: '1',
        pricePerMonth: '',
        amenities: ''
      });
      fetchProperty();
      Alert.alert('Успешно', 'Комната добавлена');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Ошибка', 'Не удалось добавить комнату');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{property.address}</Text>
          <Text style={styles.location}>{property.district}, {property.city}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="home" size={20} color="#666" />
            <Text style={styles.infoText}>{property.property_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="resize" size={20} color="#666" />
            <Text style={styles.infoText}>{property.total_area} м²</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="bed" size={20} color="#666" />
            <Text style={styles.infoText}>{property.total_rooms} комнат</Text>
          </View>
        </View>

        {property.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Комнаты ({property.rooms?.length || 0})</Text>
            <TouchableOpacity 
              style={styles.addRoomButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {property.rooms?.map((room) => (
            <View key={room.room_id} style={styles.roomCard}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomTitle}>Комната {room.room_number}</Text>
                <View style={[
                  styles.badge,
                  room.is_available ? styles.availableBadge : styles.unavailableBadge
                ]}>
                  <Text style={[
                    styles.badgeText,
                    room.is_available ? styles.availableText : styles.unavailableText
                  ]}>
                    {room.is_available ? 'Свободна' : 'Занята'}
                  </Text>
                </View>
              </View>

              <View style={styles.roomDetails}>
                <View style={styles.roomDetailRow}>
                  <Ionicons name="resize-outline" size={16} color="#666" />
                  <Text style={styles.roomDetailText}>{room.room_area} м²</Text>
                </View>
                <View style={styles.roomDetailRow}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.roomDetailText}>{room.capacity} чел.</Text>
                </View>
              </View>

              <Text style={styles.amenities}>{room.amenities}</Text>
              <Text style={styles.roomPrice}>{room.price_per_month?.toLocaleString()} ₸/мес</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Модальное окно добавления комнаты */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавить комнату</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.modalInput}
                placeholder="Номер комнаты *"
                value={newRoom.roomNumber}
                onChangeText={(v) => setNewRoom({...newRoom, roomNumber: v})}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Площадь (м²)"
                value={newRoom.roomArea}
                onChangeText={(v) => setNewRoom({...newRoom, roomArea: v})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Вместимость (чел.)"
                value={newRoom.capacity}
                onChangeText={(v) => setNewRoom({...newRoom, capacity: v})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Цена за месяц (₸) *"
                value={newRoom.pricePerMonth}
                onChangeText={(v) => setNewRoom({...newRoom, pricePerMonth: v})}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Удобства (мебель, Wi-Fi, и т.д.)"
                value={newRoom.amenities}
                onChangeText={(v) => setNewRoom({...newRoom, amenities: v})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleAddRoom}
              >
                <Text style={styles.modalButtonText}>Добавить комнату</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  location: { fontSize: 16, color: '#666' },
  infoSection: { backgroundColor: 'white', padding: 15, marginTop: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { marginLeft: 10, fontSize: 16, color: '#666' },
  section: { backgroundColor: 'white', padding: 15, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addRoomButton: { padding: 5 },
  description: { fontSize: 15, color: '#666', lineHeight: 22 },
  roomCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roomTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  availableBadge: { backgroundColor: '#E8F5E9' },
  unavailableBadge: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  availableText: { color: '#4CAF50' },
  unavailableText: { color: '#F44336' },
  roomDetails: { flexDirection: 'row', marginBottom: 8 },
  roomDetailRow: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  roomDetailText: { marginLeft: 5, fontSize: 14, color: '#666' },
  amenities: { fontSize: 14, color: '#666', marginBottom: 8 },
  roomPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF6B35' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20,
    maxHeight: '80%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalInput: { 
    backgroundColor: '#f5f5f5', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    fontSize: 16 
  },
  textArea: { height: 80 },
  modalButton: { 
    backgroundColor: '#FF6B35', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});