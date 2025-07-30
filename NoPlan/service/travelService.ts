import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';

export const travelService = {
  // 기존 함수
  fetchTrips: () => apiClient.get('/trips'),
  createTrip: (data: any) => apiClient.post('/trips', data),
  // 신규 함수: 위치 기반 지역 조회
  getRegionArea: async (lat: number, lon: number) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.get(`/users/find-region/?lat=${lat}&lon=${lon}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
  // 신규 함수: 여행 생성 (토큰 필요)
  createTripWithAuth: async (region: string, transportation: string, companion: string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.post(
      '/users/trips/',
      { region, transportation, companion },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
  // 신규 함수: 여행 정보 조회 (토큰 필요)
  getTripData: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.get(
      '/users/trips/',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
  // 신규 함수: 방문한 콘텐츠 데이터 조회 (토큰 필요)
  getVisitedContentData: async (tripId: number) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.get(
      `/users/visited-contents/?trip=${tripId}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
};