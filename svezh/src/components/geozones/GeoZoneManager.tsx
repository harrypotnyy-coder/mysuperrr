import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';

const API_URL = 'http://localhost:8083/api';

interface GeoZone {
  id: number;
  name: string;
  clientId: number;
  polygonCoordinates: number[][];
  isActive: boolean;
}

interface Client {
  id: number;
  fio: string;
}

// Компонент для управления рисованием
const DrawControl: React.FC<{ onCreated: (coordinates: number[][]) => void }> = ({ onCreated }) => {
  const map = useMap();

  useEffect(() => {
    // Настройка Geoman
    map.pm.addControls({
      position: 'topright',
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: true,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
    });

    // Обработчик создания полигона
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      if (layer instanceof L.Polygon) {
        const coordinates = layer.getLatLngs()[0].map((latLng: any) => [
          latLng.lat,
          latLng.lng
        ]);
        onCreated(coordinates);
        // Удаляем нарисованный слой после сохранения
        map.removeLayer(layer);
      }
    });

    return () => {
      map.pm.removeControls();
    };
  }, [map, onCreated]);

  return null;
};

export const GeoZoneManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [geoZones, setGeoZones] = useState<GeoZone[]>([]);
  const [zoneName, setZoneName] = useState('');
  const [mapCenter] = useState<[number, number]>([43.2566, 76.9286]); // Алматы

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadGeoZones(selectedClientId);
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadGeoZones = async (clientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/geozones/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeoZones(response.data);
    } catch (error) {
      console.error('Error loading geozones:', error);
    }
  };

  const handleCreated = async (coordinates: number[][]) => {
    if (selectedClientId && zoneName) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_URL}/geozones`,
          {
            clientId: selectedClientId,
            name: zoneName,
            polygonCoordinates: coordinates
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        alert('Геозона успешно создана!');
        setZoneName('');
        loadGeoZones(selectedClientId);
      } catch (error) {
        console.error('Error creating geozone:', error);
        alert('Ошибка при создании геозоны');
      }
    } else {
      alert('Пожалуйста, выберите осужденного и введите название геозоны');
    }
  };

  const handleDelete = async (geoZoneId: number) => {
    if (window.confirm('Удалить эту геозону?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/geozones/${geoZoneId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert('Геозона удалена!');
        if (selectedClientId) {
          loadGeoZones(selectedClientId);
        }
      } catch (error) {
        console.error('Error deleting geozone:', error);
        alert('Ошибка при удалении геозоны');
      }
    }
  };

  const toggleActive = async (geoZone: GeoZone) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/geozones/${geoZone.id}`,
        { isActive: !geoZone.isActive },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (selectedClientId) {
        loadGeoZones(selectedClientId);
      }
    } catch (error) {
      console.error('Error toggling geozone:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Управление геозонами</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>Выберите осужденного: </label>
        <select
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(Number(e.target.value))}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="">-- Выберите --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.fio}
            </option>
          ))}
        </select>
      </div>

      {selectedClientId && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Название геозоны"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <small>Нарисуйте полигон на карте после ввода названия</small>
          </div>

          <div style={{ height: '500px', marginBottom: '20px' }}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              <DrawControl onCreated={handleCreated} />

              {geoZones.map(zone => (
                <Polygon
                  key={zone.id}
                  positions={zone.polygonCoordinates as any}
                  pathOptions={{
                    color: zone.isActive ? '#00ff00' : '#ff0000',
                    weight: 2,
                    fillOpacity: 0.2
                  }}
                >
                  <Popup>
                    <div>
                      <h4>{zone.name}</h4>
                      <p>Статус: {zone.isActive ? 'Активна' : 'Неактивна'}</p>
                      <button onClick={() => toggleActive(zone)}>
                        {zone.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        style={{ marginLeft: '5px', background: '#ff0000', color: '#fff' }}
                      >
                        Удалить
                      </button>
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </MapContainer>
          </div>

          <div>
            <h3>Существующие геозоны</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Название</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Статус</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {geoZones.map(zone => (
                  <tr key={zone.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{zone.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: zone.isActive ? 'green' : 'red' }}>
                        {zone.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => toggleActive(zone)}>
                        {zone.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        style={{ marginLeft: '5px' }}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default GeoZoneManager;
