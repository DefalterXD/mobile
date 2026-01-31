// mobile/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.3.32:3000/api'; // ИЗМЕНИТЕ IP!

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  loginStudent: (email, password) => api.post('/auth/login/student', { email, password }),
  registerStudent: (data) => api.post('/auth/register/student', data),
  
  // НОВОЕ: Для владельцев
  loginLandlord: (email, password) => api.post('/auth/login/landlord', { email, password }),
  registerLandlord: (data) => api.post('/auth/register/landlord', data),
};

export const propertiesAPI = {
  getAll: () => api.get('/properties'),
  getById: (id) => api.get(`/properties/${id}`),
  
  // НОВОЕ: Для владельцев
  getMyProperties: () => api.get('/landlord/properties'),
  createProperty: (data) => api.post('/landlord/properties', data),
  addRoom: (data) => api.post('/landlord/rooms', data),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (id) => api.get(`/chat/messages/${id}`),
  createConversation: (landlordId, propertyId) => 
    api.post('/chat/conversations', { landlordId, propertyId }),
};

export const forumAPI = {
  getCategories: () => api.get('/forum/categories'),
  getPosts: (categoryId) => api.get(`/forum/posts/${categoryId}`),
  getPost: (postId) => api.get(`/forum/post/${postId}`),
  createPost: (categoryId, title, content) => 
    api.post('/forum/posts', { categoryId, title, content }),
  addComment: (postId, content) => 
    api.post('/forum/comments', { postId, content }),
  likePost: (postId) => api.post(`/forum/posts/${postId}/like`),
};

export default api;