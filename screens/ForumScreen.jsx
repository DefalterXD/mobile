import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { forumAPI } from '../api';

export default function ForumScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [activeColor, setActiveColor] = useState('#007AFF');

  useEffect(() => {
    loadTheme();
    fetchCategories();
  }, []);

  const loadTheme = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setActiveColor(user.landlord_id ? '#FF6B35' : '#007AFF');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await forumAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => {
        navigation.navigate('ForumCategory', {
          categoryId: item.category_id,
          categoryName: item.name
        });
      }}
    >
      {/* Цвет иконки и фона меняется динамически */}
      <View style={[styles.categoryIcon, { backgroundColor: activeColor + '15' }]}>
        <Ionicons name={item.icon || 'chatbubbles'} size={28} color={activeColor} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <Text style={styles.postCount}>{item.post_count} постов</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category_id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 15 },
  categoryCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 2
  },
  categoryIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  categoryDescription: { fontSize: 14, color: '#666', marginBottom: 4 },
  postCount: { fontSize: 12, color: '#999' },
});