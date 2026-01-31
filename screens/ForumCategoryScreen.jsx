import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { forumAPI } from '../api';

export default function ForumCategoryScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [activeColor, setActiveColor] = useState('#007AFF');

  useEffect(() => {
    if (categoryName) {
      navigation.setOptions({ title: categoryName });
    }
    loadTheme();
    fetchPosts();
  }, [categoryName]);

  const loadTheme = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setActiveColor(user.landlord_id ? '#FF6B35' : '#007AFF');
    }
  };

  const fetchPosts = async () => {
    if (!categoryId) return;
    try {
      const response = await forumAPI.getPosts(categoryId);
      setPosts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    try {
      await forumAPI.createPost(categoryId, newPostTitle.trim(), newPostContent.trim());
      setModalVisible(false);
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts();
      Alert.alert('Успешно', 'Пост создан');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать пост');
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('ForumPost', { postId: item.post_id })}
    >
      {item.is_pinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={14} color="#FF9800" />
          <Text style={styles.pinnedText}>Закреплено</Text>
        </View>
      )}
      
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      
      <View style={styles.postFooter}>
        <View style={styles.authorContainer}>
          {/* Аватарка в списке постов */}
          <View style={[styles.smallAvatar, { backgroundColor: item.author_type === 'landlord' ? '#FF6B35' : '#007AFF' }]}>
            <Text style={styles.smallAvatarText}>
              {item.author_name?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.authorName}>{item.author_name}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}><Ionicons name="heart-outline" size={16} color="#666" /><Text style={styles.statText}>{item.like_count || 0}</Text></View>
          <View style={styles.statItem}><Ionicons name="chatbubble-outline" size={16} color="#666" /><Text style={styles.statText}>{item.comment_count || 0}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.post_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Нет постов</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: activeColor }]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новый пост</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>

            <TextInput style={styles.titleInput} placeholder="Заголовок" value={newPostTitle} onChangeText={setNewPostTitle} />
            <TextInput style={styles.contentInput} placeholder="Текст..." value={newPostContent} onChangeText={setNewPostContent} multiline />

            <TouchableOpacity style={[styles.createButton, { backgroundColor: activeColor }]} onPress={handleCreatePost}>
              <Text style={styles.createButtonText}>Создать пост</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15 },
  postCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pinnedText: { marginLeft: 5, fontSize: 12, color: '#FF9800', fontWeight: 'bold' },
  postTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  postContent: { fontSize: 14, color: '#666', marginBottom: 12 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorContainer: { flexDirection: 'row', alignItems: 'center' },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  smallAvatarText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  authorName: { fontSize: 13, color: '#555' },
  statsContainer: { flexDirection: 'row' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  statText: { marginLeft: 4, fontSize: 12, color: '#888' },
  emptyContainer: { alignItems: 'center', padding: 50 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#999' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOpacity: 0.3, shadowRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  titleInput: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  contentInput: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16, height: 150, textAlignVertical: 'top' },
  createButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});