// components/map/RealMap.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import './RealMap.css';
import L from 'leaflet';

// Кастомная иконка с фото осужденного
const createPhotoIcon = (client: ClientWithPosition) => {
  const photoUrl = client.photoKey
    ? `http://localhost:8083/api/faces/photos/${client.photoKey}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(client.fio)}&background=3b82f6&color=fff&size=80`;

  const statusColor = client.status === 'online' ? '#10b981' : '#ef4444';

  return new L.DivIcon({
    html: `
      <div class="client-marker">
        <div class="client-avatar" style="border-color: ${statusColor}">
          <img src="${photoUrl}" alt="${client.fio}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(client.fio)}&background=3b82f6&color=fff&size=80'" />
        </div>
        <div class="status-indicator" style="background-color: ${statusColor}"></div>
      </div>
    `,
    className: 'custom-client-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });
};

interface ClientWithPosition {
  id: number;
  fio: string;
  birthDate?: string;
  sex?: string;
  inn?: string;
  passportNumber?: string;
  registrationAddress?: string;
  actualAddress?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  supervisionType?: string;
  supervisionStartDate?: string;
  supervisionEndDate?: string;
  districtName?: string;
  photoKey?: string;
  status: string;
  position?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

// Координаты центра Кыргызстана для показа всей страны
const KYRGYZSTAN_CENTER = [41.20, 74.77] as [number, number];

// Границы Кыргызстана (юго-запад, северо-восток)
const KYRGYZSTAN_BOUNDS: [[number, number], [number, number]] = [
  [39.17, 69.25], // Юго-западный угол
  [43.24, 80.28]  // Северо-восточный угол
];

// Упрощенный полигон границы Кыргызстана (красная жирная линия)
const KYRGYZSTAN_BORDER: [number, number][] = [
  [43.238, 69.464], // Северо-запад (граница с Казахстаном)
  [42.878, 70.389],
  [42.886, 71.014],
  [42.988, 71.760],
  [43.015, 72.775],
  [42.985, 73.489],
  [42.880, 74.213],
  [42.856, 74.627], // Бишкек область
  [42.871, 75.137],
  [42.999, 75.638],
  [43.015, 76.243],
  [42.988, 77.014],
  [42.880, 77.825],
  [42.828, 78.364],
  [42.779, 78.762],
  [42.656, 79.143],
  [42.398, 79.673],
  [42.036, 80.117], // Восток (граница с Китаем)
  [41.765, 80.225],
  [41.495, 80.119],
  [41.238, 79.919],
  [41.057, 79.641],
  [40.881, 79.289],
  [40.665, 78.931],
  [40.445, 78.476],
  [40.207, 77.989],
  [39.899, 77.514],
  [39.718, 77.085],
  [39.572, 76.551],
  [39.433, 75.982],
  [39.313, 75.389],
  [39.245, 74.776],
  [39.192, 74.055],
  [39.165, 73.451], // Юг (граница с Таджикистаном)
  [39.298, 72.738],
  [39.432, 72.193],
  [39.567, 71.759],
  [39.719, 71.276],
  [39.862, 70.866],
  [40.014, 70.548],
  [40.244, 70.389],
  [40.542, 70.241],
  [40.877, 70.051],
  [41.198, 69.778],
  [41.498, 69.624],
  [41.765, 69.515],
  [42.028, 69.459],
  [42.356, 69.434],
  [42.679, 69.426],
  [42.978, 69.438],
  [43.238, 69.464], // Замыкаем полигон
];

const RealMap: React.FC = () => {
  const [clients, setClients] = useState<ClientWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const response = await api.get('/admin/clients');
      const clientsData = response.data || [];

      // Временно используем тестовые позиции в Бишкеке
      // TODO: интегрировать с реальным Position API
      const clientsWithPositions = clientsData.map((client: any, index: number) => {
        const bishkekLocations = [
          [42.8746, 74.5698], // Центр Бишкека
          [42.8784, 74.5865], // Проспект Чуй
          [42.8510, 74.5585], // Юг города
          [42.8900, 74.6100], // Северо-восток
          [42.8600, 74.5400], // Запад
          [42.8350, 74.5900], // Ошский рынок
          [42.8820, 74.5920], // Ала-Тоо площадь
          [42.8450, 74.6050], // Политехнический институт
        ];

        const location = bishkekLocations[index % bishkekLocations.length];

        return {
          ...client,
          status: index % 3 === 0 ? 'offline' : 'online', // Временный статус
          position: {
            latitude: location[0],
            longitude: location[1],
            timestamp: new Date().toISOString()
          }
        };
      });

      setClients(clientsWithPositions);
    } catch (error) {
      console.error('Ошибка загрузки осужденных:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    loadClients();
  }, [loadClients]);

  const getStatusColor = (status: string) => {
    return status === 'online' ? '#10b981' : '#ef4444';
  };

  const getStatusText = (status: string) => {
    return status === 'online' ? '🟢 Онлайн' : '🔴 Оффлайн';
  };

  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  if (!isClient) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <div>Инициализация карты...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <div>Загрузка данных...</div>
      </div>
    );
  }

  const clientsWithValidPositions = clients.filter(client =>
    client.position &&
    !isNaN(client.position.latitude) &&
    !isNaN(client.position.longitude)
  );

  return (
    <div className="real-map-page">
      <div className="map-container-wrapper" style={{ position: 'relative', height: '100%', width: '100%' }}>
        <MapContainer
          center={KYRGYZSTAN_CENTER}
          zoom={7}
          minZoom={7}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          className="real-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Маска - затемняем все кроме Кыргызстана */}
          <Polygon
            positions={[
              // Внешний квадрат (весь мир)
              [
                [85, -180],
                [85, 180],
                [-85, 180],
                [-85, -180],
                [85, -180],
              ],
              // Внутренний полигон (Кыргызстан) - вырезаем эту область
              KYRGYZSTAN_BORDER
            ]}
            pathOptions={{
              color: 'transparent',
              fillColor: '#000000',    // Черный цвет
              fillOpacity: 0.7,        // 70% прозрачности для затемнения
              weight: 0
            }}
          />

          {/* Красная жирная граница Кыргызстана */}
          <Polygon
            positions={KYRGYZSTAN_BORDER}
            pathOptions={{
              color: '#DC2626',        // Яркий красный цвет
              weight: 5,               // Очень жирная линия (5px)
              opacity: 1,              // Полная непрозрачность
              fillColor: 'transparent', // Без заливки
              fillOpacity: 0
            }}
          />

          {clientsWithValidPositions.map(client => {
            const photoUrl = client.photoKey
              ? `http://localhost:8083/api/faces/photos/${client.photoKey}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(client.fio)}&background=3b82f6&color=fff&size=80`;

            const age = calculateAge(client.birthDate);

            return (
              <Marker
                key={client.id}
                position={[client.position!.latitude, client.position!.longitude]}
                icon={createPhotoIcon(client)}
              >
                <Popup maxWidth={400} className="client-popup">
                  <div className="popup-header">
                    <div className="popup-photo">
                      <img
                        src={photoUrl}
                        alt={client.fio}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.fio)}&background=3b82f6&color=fff&size=120`;
                        }}
                      />
                    </div>
                    <div className="popup-title">
                      <h3>{client.fio}</h3>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(client.status) }}
                      >
                        {getStatusText(client.status)}
                      </span>
                    </div>
                  </div>

                  <div className="popup-content">
                    <div className="info-section">
                      <h4>📋 Основная информация</h4>
                      <div className="info-row">
                        <span className="label">Возраст:</span>
                        <span className="value">{age !== null ? `${age} лет` : 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Пол:</span>
                        <span className="value">{client.sex || 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">ИНН:</span>
                        <span className="value">{client.inn || 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Паспорт:</span>
                        <span className="value">{client.passportNumber || 'Не указано'}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>📍 Адреса</h4>
                      <div className="info-row">
                        <span className="label">Регистрация:</span>
                        <span className="value">{client.registrationAddress || 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Фактический:</span>
                        <span className="value">{client.actualAddress || 'Не указано'}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>📞 Контакты</h4>
                      <div className="info-row">
                        <span className="label">Телефон:</span>
                        <span className="value">{client.phoneNumber || 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Экстренный контакт:</span>
                        <span className="value">{client.emergencyContact || 'Не указано'}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>⚖️ Надзор</h4>
                      <div className="info-row">
                        <span className="label">Тип:</span>
                        <span className="value">{client.supervisionType || 'Не указано'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Начало:</span>
                        <span className="value">{formatDate(client.supervisionStartDate)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Окончание:</span>
                        <span className="value">{formatDate(client.supervisionEndDate)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Район:</span>
                        <span className="value">{client.districtName || 'Не указано'}</span>
                      </div>
                    </div>

                    {client.position && (
                      <div className="info-section">
                        <h4>🗺️ Текущая позиция</h4>
                        <div className="info-row">
                          <span className="label">Координаты:</span>
                          <span className="value">
                            {client.position.latitude.toFixed(6)}, {client.position.longitude.toFixed(6)}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">Обновлено:</span>
                          <span className="value">
                            {new Date(client.position.timestamp).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">Локация:</span>
                          <span className="value">Бишкек</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default RealMap;
