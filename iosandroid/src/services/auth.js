import { authAPI, faceCheckAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import messaging from '@react-native-firebase/messaging'; // Временно отключено - пакет не установлен

class AuthService {
  // Сохранение токена
  async saveToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
      return true;
    } catch (error) {
      console.log('Error saving token:', error);
      return false;
    }
  }

  // Получение токена
  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.log('Error getting token:', error);
      return null;
    }
  }

  // Удаление токена (логаут)
  async removeToken() {
    try {
      await AsyncStorage.removeItem('authToken');
      return true;
    } catch (error) {
      console.log('Error removing token:', error);
      return false;
    }
  }

  // Проверка валидности токена
  async validateToken() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const response = await authAPI.getMe();
      return response.data.user !== null;
    } catch (error) {
      console.log('Token validation error:', error);
      await this.removeToken();
      return false;
    }
  }

  // Регистрация FCM токена для пользователя
  async registerFCMToken(userUniqueId) {
    // Временно отключено - Firebase messaging не установлен
    console.log('FCM token registration skipped - Firebase not configured');
    return null;

    /* try {
      // Запрашиваем разрешение на уведомления
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const fcmToken = await messaging().getToken();

        // Регистрируем токен на бэкенде
        await faceCheckAPI.registerFCMToken(userUniqueId, fcmToken);

        console.log('FCM token registered:', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.log('FCM registration error:', error);
    }
    return null; */
  }

  // Обновление FCM токена (при изменении)
  async refreshFCMToken(userUniqueId) {
    // Временно отключено - Firebase messaging не установлен
    console.log('FCM token refresh skipped - Firebase not configured');
    return null;

    /* try {
      const fcmToken = await messaging().getToken();
      await faceCheckAPI.registerFCMToken(userUniqueId, fcmToken);
      return fcmToken;
    } catch (error) {
      console.log('FCM token refresh error:', error);
      return null;
    } */
  }

  // Получение информации о сессии
  async getSessionInfo() {
    try {
      const token = await this.getToken();
      if (!token) return null;

      const response = await authAPI.getMe();
      return {
        user: response.data.user,
        token: token,
      };
    } catch (error) {
      console.log('Session info error:', error);
      return null;
    }
  }

  // Сохранение пользовательских настроек
  async saveUserSettings(settings) {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.log('Error saving settings:', error);
      return false;
    }
  }

  // Загрузка пользовательских настроек
  async loadUserSettings() {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.log('Error loading settings:', error);
      return {};
    }
  }

  // Очистка всех данных пользователя
  async clearAllData() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.log('Error clearing data:', error);
      return false;
    }
  }

  // Проверка первого запуска приложения
  async isFirstLaunch() {
    try {
      const firstLaunch = await AsyncStorage.getItem('firstLaunch');
      if (!firstLaunch) {
        await AsyncStorage.setItem('firstLaunch', 'false');
        return true;
      }
      return false;
    } catch (error) {
      console.log('First launch check error:', error);
      return true;
    }
  }

  // Сохранение данных для быстрого входа
  async saveLoginCredentials(inn, rememberMe = false) {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('lastLoginINN', inn);
      } else {
        await AsyncStorage.removeItem('lastLoginINN');
      }
      return true;
    } catch (error) {
      console.log('Error saving credentials:', error);
      return false;
    }
  }

  // Получение последнего логина
  async getLastLoginINN() {
    try {
      return await AsyncStorage.getItem('lastLoginINN');
    } catch (error) {
      console.log('Error getting last login:', error);
      return null;
    }
  }
}

export default new AuthService();