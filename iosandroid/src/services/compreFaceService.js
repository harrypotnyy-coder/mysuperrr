/**
 * CompreFace Integration Service
 * Exadel CompreFace - бесплатная open-source система распознавания лиц
 */

import { COMPREFACE_CONFIG, API_CONFIG } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class CompreFaceService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL; // Используем Spring Boot как прокси
    this.compreFaceURL = COMPREFACE_CONFIG.BASE_URL;
    this.apiKey = COMPREFACE_CONFIG.API_KEY;
  }

  /**
   * Регистрация нового лица в системе
   * @param {string} userId - ID пользователя (ИНН)
   * @param {Object} imageFile - Файл изображения { uri, type, name }
   * @returns {Promise} Результат регистрации
   */
  async addFace(userId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'face.jpg',
      });

      // Отправляем через Spring Boot API
      const response = await fetch(`${this.baseURL}/compreface/add-face/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': await this.getAuthToken(),
        },
        body: formData,
      });

      const data = await response.json();

      console.log('📸 CompreFace - Add Face Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add face');
      }

      return {
        success: true,
        data: data,
        imageId: data.image_id,
        subject: data.subject,
      };
    } catch (error) {
      console.log('❌ CompreFace Add Face Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Верификация лица - сравнение с зарегистрированным
   * @param {string} userId - ID пользователя (ИНН)
   * @param {Object} imageFile - Файл изображения для проверки
   * @returns {Promise} Результат верификации
   */
  async verifyFace(userId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'verify.jpg',
      });

      console.log('🔍 CompreFace - Verifying face for user:', userId);

      // Отправляем через Spring Boot API
      const response = await fetch(`${this.baseURL}/compreface/verify/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': await this.getAuthToken(),
        },
        body: formData,
      });

      const data = await response.json();

      console.log('📊 CompreFace - Verify Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Обрабатываем результат
      const similarity = data.similarity || 0;
      const verified = data.verified || similarity >= COMPREFACE_CONFIG.SIMILARITY_THRESHOLD;

      return {
        success: true,
        verified: verified,
        similarity: similarity,
        confidence: data.confidence || similarity,
        message: verified
          ? `Лицо подтверждено! Схожесть: ${(similarity * 100).toFixed(1)}%`
          : `Лицо не распознано. Схожесть: ${(similarity * 100).toFixed(1)}%`,
        data: data,
      };
    } catch (error) {
      console.log('❌ CompreFace Verify Error:', error);
      return {
        success: false,
        verified: false,
        error: error.message,
        message: 'Ошибка верификации лица',
      };
    }
  }

  /**
   * Распознавание лица - поиск среди всех зарегистрированных
   * @param {Object} imageFile - Файл изображения
   * @returns {Promise} Результат распознавания
   */
  async recognizeFace(imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'recognize.jpg',
      });

      console.log('🔎 CompreFace - Recognizing face...');

      // Отправляем через Spring Boot API
      const response = await fetch(`${this.baseURL}/compreface/recognize`, {
        method: 'POST',
        headers: {
          'Authorization': await this.getAuthToken(),
        },
        body: formData,
      });

      const data = await response.json();

      console.log('📊 CompreFace - Recognition Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Recognition failed');
      }

      // Обрабатываем результаты
      const results = data.result || [];

      if (results.length === 0) {
        return {
          success: true,
          found: false,
          message: 'Лицо не найдено в базе',
        };
      }

      // Берем лучшее совпадение
      const bestMatch = results[0];
      const subjects = bestMatch.subjects || [];

      if (subjects.length === 0) {
        return {
          success: true,
          found: false,
          message: 'Лицо не найдено в базе',
        };
      }

      const topSubject = subjects[0];

      return {
        success: true,
        found: true,
        userId: topSubject.subject,
        similarity: topSubject.similarity,
        confidence: bestMatch.similarity,
        message: `Найдено: ${topSubject.subject} (${(topSubject.similarity * 100).toFixed(1)}%)`,
        data: data,
      };
    } catch (error) {
      console.log('❌ CompreFace Recognition Error:', error);
      return {
        success: false,
        found: false,
        error: error.message,
        message: 'Ошибка распознавания лица',
      };
    }
  }

  /**
   * Удаление лица из системы
   * @param {string} userId - ID пользователя (ИНН)
   * @param {string} imageId - ID изображения (опционально)
   * @returns {Promise} Результат удаления
   */
  async deleteFace(userId, imageId = null) {
    try {
      const url = imageId
        ? `${this.baseURL}/compreface/delete-face/${userId}/${imageId}`
        : `${this.baseURL}/compreface/delete-all-faces/${userId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': await this.getAuthToken(),
        },
      });

      const data = await response.json();

      console.log('🗑️ CompreFace - Delete Face Response:', data);

      return {
        success: response.ok,
        message: data.message || 'Face deleted',
      };
    } catch (error) {
      console.log('❌ CompreFace Delete Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получение списка всех зарегистрированных лиц
   * @returns {Promise} Список лиц
   */
  async listFaces() {
    try {
      const response = await fetch(`${this.baseURL}/compreface/faces`, {
        method: 'GET',
        headers: {
          'Authorization': await this.getAuthToken(),
        },
      });

      const data = await response.json();

      console.log('📋 CompreFace - List Faces:', data);

      return {
        success: response.ok,
        faces: data.faces || [],
      };
    } catch (error) {
      console.log('❌ CompreFace List Error:', error);
      return {
        success: false,
        faces: [],
        error: error.message,
      };
    }
  }

  /**
   * Получение токена авторизации
   * @returns {Promise<string>} Bearer token
   */
  async getAuthToken() {
    const token = await AsyncStorage.getItem('authToken');
    return token ? `Bearer ${token}` : '';
  }
}

// Создаем и экспортируем singleton instance
const compreFaceService = new CompreFaceService();
export default compreFaceService;
