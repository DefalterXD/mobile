import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

export default function LoginScreen({ navigation, onLogin }) {
  const [userType, setUserType] = useState('student'); // 'student' или 'landlord'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Динамический цвет: синий для студента, оранжевый для владельца
  const activeColor = userType === 'student' ? '#007AFF' : '#FF6B35';
  const lightBackgroundColor = userType === 'student' ? '#E3F2FD' : '#FFF3E0';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = userType === 'student' 
        ? await authAPI.loginStudent(email, password)
        : await authAPI.loginLandlord(email, password);
        
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      if (onLogin) {
        onLogin();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (userType === 'student') {
      if (!firstName || !lastName || !email || !password) {
        Alert.alert('Ошибка', 'Заполните все обязательные поля');
        return;
      }
    } else {
      if (!firstName || !lastName || !email || !phone || !password) {
        Alert.alert('Ошибка', 'Заполните все обязательные поля');
        return;
      }
    }

    setLoading(true);
    try {
      const response = userType === 'student'
        ? await authAPI.registerStudent({
            firstName, lastName, email, password, university: university || 'КазНУ'
          })
        : await authAPI.registerLandlord({
            firstName, lastName, email, phone, password, companyName
          });
      
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      if (onLogin) {
        onLogin();
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: activeColor }]}>Homless</Text>
          <Text style={styles.subtitle}>Аренда жилья для студентов</Text>
        </View>

        <View style={styles.userTypeContainer}>
          <TouchableOpacity 
            style={[
              styles.userTypeButton, 
              userType === 'student' && { borderColor: activeColor, backgroundColor: lightBackgroundColor }
            ]}
            onPress={() => setUserType('student')}
          >
            <Text style={[styles.userTypeText, userType === 'student' && { color: activeColor, fontWeight: 'bold' }]}>
              Студент
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.userTypeButton, 
              userType === 'landlord' && { borderColor: activeColor, backgroundColor: lightBackgroundColor }
            ]}
            onPress={() => setUserType('landlord')}
          >
            <Text style={[styles.userTypeText, userType === 'landlord' && { color: activeColor, fontWeight: 'bold' }]}>
              Владелец
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, isLogin && { backgroundColor: activeColor }]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Вход</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, !isLogin && { backgroundColor: activeColor }]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Регистрация</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Имя *"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Фамилия *"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              
              {userType === 'student' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Университет"
                  value={university}
                  onChangeText={setUniversity}
                />
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Телефон *"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Название компании (опционально)"
                    value={companyName}
                    onChangeText={setCompanyName}
                  />
                </>
              )}
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Пароль *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: activeColor }]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  
  userTypeContainer: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    gap: 10 
  },
  userTypeButton: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: 'white', 
    borderRadius: 10, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd'
  },
  userTypeText: { 
    fontSize: 16, 
    color: '#666' 
  },
  
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'white', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  form: { marginBottom: 20 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  button: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});