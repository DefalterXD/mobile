// mobile/screens/landlord/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatAPI } from '../../api';
import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.3.32:3000'; // ИЗМЕНИТЕ IP!

export default function ChatScreen({ route }) {
  const conversationId = route?.params?.conversationId;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userData, setUserData] = useState(null);
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      console.error("No conversationId provided");
      return;
    }
    initChat();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [conversationId]);
  
  if (!conversationId) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const initChat = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('userData'));
    setUserData(user);
    
    await fetchMessages();
    
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    newSocket.emit('join_conversation', conversationId);
    
    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const fetchMessages = async () => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !userData) return;

    socket.emit('send_message', {
      conversationId,
      senderType: 'landlord',
      senderId: userData.landlord_id,
      messageText: inputText.trim()
    });

    setInputText('');
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_type === 'landlord' && 
                       item.sender_id === userData?.landlord_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.theirBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.message_text}
          </Text>
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Начните общение</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Введите сообщение..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  messagesList: { padding: 15, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: '#999' },
  messageContainer: { marginBottom: 10 },
  myMessage: { alignItems: 'flex-end' },
  theirMessage: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 15 },
  myBubble: { backgroundColor: '#FF6B35', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#E5E5EA', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 20 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#000' },
  messageTime: { fontSize: 11, marginTop: 5, color: '#666' },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#e0e0e0', 
    alignItems: 'flex-end'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    marginRight: 10, 
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: { 
    backgroundColor: '#FF6B35', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0'
  }
});