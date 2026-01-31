// mobile/screens/landlord/AddPropertyScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { propertiesAPI } from '../../api';

export default function AddPropertyScreen({ navigation }) {
  const [formData, setFormData] = useState({
    address: '',
    city: 'Алматы',
    district: '',
    propertyType: 'квартира',
    totalRooms: '',
    totalArea: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.address || !formData.district || !formData.totalRooms) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await propertiesAPI.createProperty(formData);
      Alert.alert('Успешно', 'Объект добавлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Ошибка', 'Не удалось добавить объект');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Основная информация</Text>

        <Text style={styles.label}>Адрес *</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: ул. Абая 150"
          value={formData.address}
          onChangeText={(v) => updateField('address', v)}
        />

        <Text style={styles.label}>Город *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.city}
            onValueChange={(v) => updateField('city', v)}
            style={styles.picker}
          >
            <Picker.Item label="Алматы" value="Алматы" />
            <Picker.Item label="Астана" value="Астана" />
            <Picker.Item label="Шымкент" value="Шымкент" />
            <Picker.Item label="Караганда" value="Караганда" />
          </Picker>
        </View>

        <Text style={styles.label}>Район *</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: Алмалинский"
          value={formData.district}
          onChangeText={(v) => updateField('district', v)}
        />

        <Text style={styles.label}>Тип недвижимости *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.propertyType}
            onValueChange={(v) => updateField('propertyType', v)}
            style={styles.picker}
          >
            <Picker.Item label="Квартира" value="квартира" />
            <Picker.Item label="Дом" value="дом" />
            <Picker.Item label="Общежитие" value="общежитие" />
            <Picker.Item label="Комната" value="комната" />
          </Picker>
        </View>

        <Text style={styles.label}>Количество комнат *</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: 3"
          value={formData.totalRooms}
          onChangeText={(v) => updateField('totalRooms', v)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Общая площадь (м²)</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: 85.5"
          value={formData.totalArea}
          onChangeText={(v) => updateField('totalArea', v)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Опишите особенности объекта..."
          value={formData.description}
          onChangeText={(v) => updateField('description', v)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Добавление...' : 'Добавить объект'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  textArea: { height: 120 },
  pickerContainer: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  picker: { height: 50 },
  submitButton: { 
    backgroundColor: '#FF6B35', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});