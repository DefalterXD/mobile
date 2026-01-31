import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { forumAPI } from '../api';

export default function ForumPostScreen({ route }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  
  // Цвета текущего пользователя
  const [activeColor, setActiveColor] = useState('#007AFF');

  useEffect(() => {
    loadTheme();
    fetchPost();
    
    const interval = setInterval(fetchPost, 5000); // 5 сек достаточно для Expo
    return () => clearInterval(interval);
  }, []);

const loadTheme = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      console.log('Данные пользователя из хранилища:', userData); // СМОТРИМ В КОНСОЛЬ EXPO

      if (userData) {
        const user = JSON.parse(userData);
        
        // Проверяем наличие landlord_id в разных возможных местах объекта
        const isLandlord = user.landlord_id || (user.user && user.user.landlord_id);
        
        console.log('Является ли владельцем?:', !!isLandlord);
        
        setActiveColor(isLandlord ? '#FF6B35' : '#007AFF');
      }
    } catch (e) {
      console.error('Ошибка загрузки темы:', e);
    }
  };
  
  const fetchPost = async () => {
    try {
      const response = await forumAPI.getPost(postId);
      setPost(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await forumAPI.likePost(postId);
      setLiked(!liked);
      fetchPost();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await forumAPI.addComment(postId, commentText.trim());
      setCommentText('');
      fetchPost();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить комментарий');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView>
        <View style={styles.postDetail}>
          <Text style={styles.postDetailTitle}>{post.title}</Text>

          <View style={styles.authorRow}>
            {/* Цвет аватарки зависит от того, КТО написал пост */}
            <View style={[styles.postAvatar, { backgroundColor: post.author_type === 'landlord' ? '#FF6B35' : '#007AFF' }]}>
              <Text style={styles.postAvatarText}>
                {post.author_name?.[0] || 'U'}
              </Text>
            </View>
            <View>
              <View style={styles.authorNameRow}>
                <Text style={styles.postDetailAuthor}>{post.author_name}</Text>
                <View style={[
                  styles.roleBadge,
                  post.author_type === 'landlord' ? styles.landlordRoleBadge : styles.studentRoleBadge
                ]}>
                  <Text style={[styles.roleText, { color: post.author_type === 'landlord' ? '#E65100' : '#0D47A1' }]}>
                    {post.author_type === 'landlord' ? '🏢 Владелец' : '👨‍🎓 Студент'}
                  </Text>
                </View>
              </View>
              <Text style={styles.postDate}>
                {new Date(post.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          </View>

          <Text style={styles.postDetailContent}>{post.content}</Text>

          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? "#F44336" : "#666"}
              />
              <Text style={styles.actionText}>{post.like_count || 0}</Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Комментарии</Text>

          {post.comments?.map((comment) => (
            <View key={comment.comment_id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                {/* Цвет аватарки комментатора */}
                <View style={[styles.commentAvatar, { backgroundColor: comment.author_type === 'landlord' ? '#FF6B35' : '#007AFF' }]}>
                  <Text style={styles.commentAvatarText}>
                    {comment.author_name?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.commentInfo}>
                  <View style={styles.commentAuthorRow}>
                    <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                    <Text style={styles.commentRoleTextSmall}>
                       {comment.author_type === 'landlord' ? '• Владелец' : '• Студент'}
                    </Text>
                  </View>
                  <Text style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Добавить комментарий..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.commentSendButton, { backgroundColor: activeColor }]}
          onPress={handleComment}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  postDetail: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  postDetailTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#1a1a1a' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  postAvatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  authorNameRow: { flexDirection: 'row', alignItems: 'center' },
  postDetailAuthor: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  studentRoleBadge: { backgroundColor: '#E3F2FD' },
  landlordRoleBadge: { backgroundColor: '#FFF3E0' },
  roleText: { fontSize: 10, fontWeight: 'bold' },
  postDate: { fontSize: 12, color: '#999', marginTop: 2 },
  postDetailContent: { fontSize: 16, lineHeight: 24, color: '#333', marginVertical: 15 },
  actionBar: { flexDirection: 'row', marginTop: 10, gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 6, fontSize: 14, color: '#666', fontWeight: '600' },
  commentsSection: { padding: 20 },
  commentsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  commentCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  commentHeader: { flexDirection: 'row', marginBottom: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  commentAvatarText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  commentAuthor: { fontSize: 14, fontWeight: 'bold' },
  commentRoleTextSmall: { fontSize: 10, color: '#999', marginLeft: 5 },
  commentDate: { fontSize: 11, color: '#bbb' },
  commentText: { fontSize: 14, color: '#444', lineHeight: 20 },
  commentInputContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: '#f1f3f5', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
  commentSendButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});