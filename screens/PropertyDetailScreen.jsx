import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertiesAPI, chatAPI } from '../api';

export default function PropertyDetailScreen({ route, navigation }) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleContact = async () => {
    try {
      const response = await chatAPI.createConversation(
        property.landlord_id,
        property.property_id
      );
      navigation.navigate('ChatTab', { 
        screen: 'Chat', 
        params: { conversationId: response.data.conversation_id }
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать чат');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text>Объект не найден</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: 'https://via.placeholder.com/400x300' }}
          style={styles.headerImage}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{property.address}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#007AFF" />
            <Text style={styles.locationText}>
              {property.district}, {property.city}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="home" size={20} color="#666" />
              <Text style={styles.statText}>{property.property_type}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="resize" size={20} color="#666" />
              <Text style={styles.statText}>{property.total_area} м²</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bed" size={20} color="#666" />
              <Text style={styles.statText}>{property.total_rooms} комнат</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Владелец</Text>
            <View style={styles.landlordCard}>
              <View>
                <Text style={styles.landlordName}>{property.landlord_name}</Text>
                <Text style={styles.landlordPhone}>{property.landlord_phone}</Text>
              </View>
              <TouchableOpacity style={styles.chatButton} onPress={handleContact}>
                <Ionicons name="chatbubble-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комнаты ({property.rooms?.length || 0})</Text>
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
                      {room.is_available ? 'Доступна' : 'Занята'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.roomDetails}>
                  {room.room_area} м² • {room.capacity} чел.
                </Text>
                <Text style={styles.amenities}>{room.amenities}</Text>
                <Text style={styles.roomPrice}>
                  {room.price_per_month.toLocaleString()} ₸/мес
                </Text>
              </View>
            ))}
          </View>

          {property.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Отзывы ({property.reviews.length})
              </Text>
              {property.reviews.map((review) => (
                <View key={review.review_id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.student_name}</Text>
                    <View style={styles.stars}>
                      {[...Array(review.rating)].map((_, i) => (
                        <Ionicons key={i} name="star" size={14} color="#FFD700" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonText}>Связаться с владельцем</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImage: { width: '100%', height: 250 },
  content: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  locationText: { marginLeft: 5, fontSize: 16, color: '#666' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  statItem: { alignItems: 'center' },
  statText: { marginTop: 5, fontSize: 14, color: '#666' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 22, color: '#666' },
  landlordCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10 
  },
  landlordName: { fontSize: 17, fontWeight: 'bold' },
  landlordPhone: { fontSize: 14, color: '#666', marginTop: 4 },
  chatButton: { 
    backgroundColor: '#007AFF', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  roomCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  roomHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  roomTitle: { fontSize: 16, fontWeight: 'bold' },
  roomDetails: { fontSize: 14, color: '#666', marginBottom: 5 },
  amenities: { fontSize: 14, color: '#666', marginBottom: 8 },
  roomPrice: { fontSize: 17, fontWeight: 'bold', color: '#007AFF' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  availableBadge: { backgroundColor: '#E8F5E9' },
  unavailableBadge: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  availableText: { color: '#4CAF50' },
  unavailableText: { color: '#F44336' },
  reviewCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { fontSize: 15, fontWeight: 'bold' },
  stars: { flexDirection: 'row' },
  reviewText: { fontSize: 14, color: '#666' },
  footer: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#e0e0e0' 
  },
  contactButton: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  contactButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});