import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';

const SOCKET_URL = 'http://10.233.42.248:3000';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState(null);

  // Функция загрузки данных
  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Обновляем данные при каждом возврате на экран
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  useEffect(() => {
    let newSocket;

    const initSocket = async () => {
      const storedData = await AsyncStorage.getItem('userData');
      const user = JSON.parse(storedData);
      const userId = user?.id || user?.landlord_id;

      newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      // Присоединяемся к персональной комнате пользователя, 
      // чтобы получать уведомления о новых сообщениях во всех чатах
      newSocket.emit('join_user_room', `user_${userId}`);

      // Слушаем событие обновления списка
      newSocket.on('update_chat_list', () => {
        console.log('Список чатов обновлен через сокет');
        fetchConversations();
      });
    };

    initSocket();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => {
        navigation.navigate('ChatTab', {
          screen: 'ChatDetail',
          params: { conversationId: item.conversation_id }
        });
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.student_name?.[0] || 'S'}
        </Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.row}>
          <Text style={styles.conversationName}>{item.student_name}</Text>
          <Text style={styles.time}>
            {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || 'Новый диалог'}
        </Text>
        {item.address && (
          <Text style={styles.address} numberOfLines={1}>📍 {item.address}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.conversation_id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Нет чатов</Text>
            <Text style={styles.emptyHint}>
              Студенты свяжутся с вами через ваши объявления
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  conversationInfo: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  conversationName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  time: { fontSize: 12, color: '#999' },
  lastMessage: { fontSize: 14, color: '#666', marginBottom: 4 },
  address: { fontSize: 12, color: '#FF6B35', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', padding: 40, paddingTop: 100 },
  emptyText: { marginTop: 10, fontSize: 18, color: '#999', fontWeight: 'bold' },
  emptyHint: { marginTop: 5, fontSize: 14, color: '#ccc', textAlign: 'center' },
});