import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import compreFaceService from '../services/compreFaceService';
import { useAuth } from '../store/authContext';
import CameraScreen from './CameraScreen';

const FaceCheckScreen = () => {
  const [loading, setLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();

  const takePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Ошибка', 'Необходим доступ к камере');
        return;
      }
    }

    setCameraVisible(true);
  };

  const handlePhotoTaken = async (photo) => {
    setCameraVisible(false);
    setLoading(true);

    try {
      console.log('📸 Starting CompreFace verification...');

      // Используем CompreFace для верификации
      const result = await compreFaceService.verifyFace(
        user.inn || user.name,
        photo
      );

      console.log('🔍 Verification result:', result);

      if (result.success) {
        Alert.alert(
          result.verified ? '✅ Успешно' : '❌ Не пройдено',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Можно добавить логику после проверки
              }
            }
          ]
        );

        // Если лицо не зарегистрировано, предлагаем зарегистрировать
        if (!result.verified && result.similarity < 0.3) {
          Alert.alert(
            'Регистрация лица',
            'Похоже, ваше лицо еще не зарегистрировано. Хотите зарегистрировать его сейчас?',
            [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Зарегистрировать',
                onPress: () => registerFace(photo)
              }
            ]
          );
        }
      } else {
        Alert.alert('Ошибка', result.message || 'Не удалось выполнить проверку');
      }

    } catch (error) {
      console.log('❌ Face check error:', error);
      Alert.alert('Ошибка', 'Не удалось выполнить проверку лица');
    } finally {
      setLoading(false);
    }
  };

  const registerFace = async (photo) => {
    setLoading(true);
    try {
      console.log('📝 Registering face...');

      const result = await compreFaceService.addFace(
        user.inn || user.name,
        photo
      );

      if (result.success) {
        Alert.alert(
          '✅ Успешно',
          'Ваше лицо успешно зарегистрировано! Теперь вы можете использовать Face ID.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось зарегистрировать лицо');
      }
    } catch (error) {
      console.log('❌ Register face error:', error);
      Alert.alert('Ошибка', 'Не удалось зарегистрировать лицо');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      handlePhotoTaken(result.assets[0]);
    }
  };

  if (cameraVisible) {
    return (
      <CameraScreen 
        onPhotoTaken={handlePhotoTaken}
        onCancel={() => setCameraVisible(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎭 Проверка Face-ID</Text>
      <Text style={styles.subtitle}>CompreFace Recognition</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Проверяем лицо...</Text>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📸</Text>
            <Text style={styles.buttonText}>Сделать фото</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Выбрать из галереи</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FaceCheckScreen;