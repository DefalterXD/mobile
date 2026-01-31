
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Общие экраны
import LoginScreen from './screens/LoginScreen';

// Экраны студента
import HomeScreen from './screens/HomeScreen';
import PropertyDetailScreen from './screens/PropertyDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import ForumScreen from './screens/ForumScreen';
import ForumCategoryScreen from './screens/ForumCategoryScreen';
import ForumPostScreen from './screens/ForumPostScreen';
import ProfileScreen from './screens/ProfileScreen';

// Экраны владельца
import LandlordDashboardScreen from './screens/landlord/DashboardScreen';
import LandlordPropertiesScreen from './screens/landlord/PropertiesScreen';
import LandlordAddPropertyScreen from './screens/landlord/AddPropertyScreen';
import LandlordPropertyDetailScreen from './screens/landlord/PropertyDetailScreen';
import LandlordChatListScreen from './screens/landlord/ChatListScreen';
import LandlordChatScreen from './screens/landlord/ChatScreen';
import LandlordProfileScreen from './screens/landlord/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ========== ОБЩИЙ СТЕК ФОРУМА (используется обоими ролями) ==========
function ForumStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ForumCategories" component={ForumScreen} options={{ title: 'Форум' }} />
      <Stack.Screen name="ForumCategory" component={ForumCategoryScreen} />
      <Stack.Screen name="ForumPost" component={ForumPostScreen} options={{ title: 'Пост' }} />
    </Stack.Navigator>
  );
}

// ========== СТЕКИ ДЛЯ СТУДЕНТОВ ==========
function StudentHomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ title: 'Объекты' }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Детали' }} />
    </Stack.Navigator>
  );
}

function StudentChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Чаты' }} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} options={{ title: 'Чат' }} />
    </Stack.Navigator>
  );
}

// ========== СТЕКИ ДЛЯ ВЛАДЕЛЬЦЕВ ==========
function LandlordPropertiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PropertiesList" component={LandlordPropertiesScreen} options={{ title: 'Мои объекты' }} />
      <Stack.Screen name="AddProperty" component={LandlordAddPropertyScreen} options={{ title: 'Добавить объект' }} />
      <Stack.Screen name="PropertyDetail" component={LandlordPropertyDetailScreen} options={{ title: 'Детали' }} />
    </Stack.Navigator>
  );
}

function LandlordChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatList" component={LandlordChatListScreen} options={{ title: 'Чаты' }} />
      <Stack.Screen name="ChatDetail" component={LandlordChatScreen} options={{ title: 'Чат' }} />
    </Stack.Navigator>
  );
}

// ========== ТАБЫ ДЛЯ СТУДЕНТОВ ==========
function StudentTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'ChatTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'ForumTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeStack} options={{ headerShown: false, title: 'Главная' }} />
      <Tab.Screen name="ChatTab" component={StudentChatStack} options={{ headerShown: false, title: 'Чаты' }} />
      <Tab.Screen name="ForumTab" component={ForumStack} options={{ headerShown: false, title: 'Форум' }} />
      <Tab.Screen name="Profile" options={{ title: 'Профиль' }}>
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ========== ТАБЫ ДЛЯ ВЛАДЕЛЬЦЕВ ==========
function LandlordTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Properties') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'ChatTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'ForumTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={LandlordDashboardScreen} options={{ title: 'Панель' }} />
      <Tab.Screen name="Properties" component={LandlordPropertiesStack} options={{ headerShown: false, title: 'Объекты' }} />
      <Tab.Screen name="ChatTab" component={LandlordChatStack} options={{ headerShown: false, title: 'Чаты' }} />
      <Tab.Screen name="ForumTab" component={ForumStack} options={{ headerShown: false, title: 'Форум' }} />
      <Tab.Screen name="Profile" options={{ title: 'Профиль' }}>
        {(props) => <LandlordProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkLoginStatus(); }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) {
        const user = JSON.parse(userData);
        setUserType(user.role || user.userType);
        setIsLoggedIn(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsLoggedIn(false);
    setUserType(null);
  };

  const handleLogin = async () => {
    const userData = await AsyncStorage.getItem('userData');
    const user = JSON.parse(userData);
    setUserType(user.role || user.userType);
    setIsLoggedIn(true);
  };

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Main">
            {(props) => userType === 'landlord' ? 
              <LandlordTabs {...props} onLogout={handleLogout} /> : 
              <StudentTabs {...props} onLogout={handleLogout} />
            }
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}