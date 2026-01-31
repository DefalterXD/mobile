import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Alert, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ onLogout }) {
    const [userData, setUserData] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editData, setEditData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        companyName: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await AsyncStorage.getItem('userData');
            if (user) {
                const parsedUser = JSON.parse(user);
                setUserData(parsedUser);
                setEditData({
                    firstName: parsedUser.first_name || '',
                    lastName: parsedUser.last_name || '',
                    phone: parsedUser.phone || '',
                    companyName: parsedUser.company_name || ''
                });
            }
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    };

    const handleSaveChanges = async () => {
        try {
            const updatedUser = {
                ...userData,
                first_name: editData.firstName,
                last_name: editData.lastName,
                company_name: editData.companyName,
                phone: editData.phone
            };

            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            setEditModalVisible(false);

            if (Platform.OS === 'web') {
                window.alert('Успешно: Профиль обновлен');
            } else {
                Alert.alert('Успешно', 'Профиль обновлен');
            }
        } catch (error) {
            const errorMsg = 'Не удалось сохранить изменения';
            Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('Ошибка', errorMsg);
        }
    };

    const performLogout = async () => {
        try {
            await AsyncStorage.removeItem('userData');
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Вы уверены, что хотите выйти?')) {
                performLogout();
            }
        } else {
            Alert.alert('Выход', 'Вы уверены?', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Выйти', style: 'destructive', onPress: performLogout }
            ]);
        }
    };

    if (!userData) {
        return (
            <View style={styles.centerContainer}>
                <Text>Загрузка...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                        {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                    </Text>
                </View>
                <Text style={styles.userName}>
                    {userData?.first_name} {userData?.last_name}
                </Text>
                {userData?.company_name && (
                    <Text style={styles.companyName}>🏢 {userData.company_name}</Text>
                )}
                <Text style={styles.userEmail}>{userData?.email}</Text>

                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={styles.ratingText}>
                        {typeof userData.rating === 'number' ? userData.rating.toFixed(1) : '5.0'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Информация</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={24} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{userData.email}</Text>
                    </View>
                </View>
                {userData.phone && (
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={24} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Телефон</Text>
                            <Text style={styles.infoValue}>{userData.phone}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.menuItem, Platform.OS === 'web' && { cursor: 'pointer' }]}
                    onPress={() => setEditModalVisible(true)}
                >
                    <Ionicons name="create-outline" size={24} color="#333" />
                    <Text style={styles.menuItemText}>Редактировать профиль</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, Platform.OS === 'web' && { cursor: 'pointer' }]}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                    <Text style={styles.menuItemText}>Объявления</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={[styles.logoutButton, Platform.OS === 'web' && { cursor: 'pointer' }]} 
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
                <Text style={styles.logoutText}>Выйти из аккаунта</Text>
            </TouchableOpacity>

            {/* Модальное окно */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Редактирование</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalLabel}>Имя</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editData.firstName}
                                onChangeText={(v) => setEditData({ ...editData, firstName: v })}
                            />
                            <Text style={styles.modalLabel}>Фамилия</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editData.lastName}
                                onChangeText={(v) => setEditData({ ...editData, lastName: v })}
                            />
                            <Text style={styles.modalLabel}>Телефон</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editData.phone}
                                keyboardType="phone-pad"
                                onChangeText={(v) => setEditData({ ...editData, phone: v })}
                            />
                            <Text style={styles.modalLabel}>Компания</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editData.companyName}
                                onChangeText={(v) => setEditData({ ...editData, companyName: v })}
                            />
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                                <Text style={styles.saveButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: 'white', alignItems: 'center', padding: 30, marginBottom: 10 },
    avatarLarge: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', marginBottom: 15
    },
    avatarLargeText: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    companyName: { fontSize: 16, color: '#666', marginBottom: 5 },
    userEmail: { fontSize: 14, color: '#999', marginBottom: 10 },
    ratingContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF3E0', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20
    },
    ratingText: { marginLeft: 5, fontSize: 16, fontWeight: 'bold', color: '#333' },
    section: { backgroundColor: 'white', marginBottom: 10, padding: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#999', textTransform: 'uppercase' },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    infoContent: { marginLeft: 15, flex: 1 },
    infoLabel: { fontSize: 12, color: '#999' },
    infoValue: { fontSize: 16, color: '#333' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuItemText: { flex: 1, fontSize: 16, marginLeft: 15, color: '#333' },
    logoutButton: {
        flexDirection: 'row', backgroundColor: 'white', padding: 15, margin: 15,
        borderRadius: 10, alignItems: 'center', justifyContent: 'center'
    },
    logoutText: { marginLeft: 10, fontSize: 16, color: '#F44336', fontWeight: 'bold' },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
        alignItems: Platform.OS === 'web' ? 'center' : 'stretch'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
        width: Platform.OS === 'web' ? 400 : '100%',
        borderRadius: Platform.OS === 'web' ? 20 : 0
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalLabel: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 10 },
    modalInput: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, fontSize: 16 },
    saveButton: { backgroundColor: '#FF6B35', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});