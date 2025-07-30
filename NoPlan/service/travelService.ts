// service/travelService.ts

import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';

/**
 * API로부터 받는 여행 데이터의 타입을 정의합니다.
 * 실제 서버의 응답 데이터 구조에 맞게 필드를 추가하거나 수정하세요.
 */

export interface Trip {
  id: number;
  region: string;
  created_at: string;
}
export interface VisitedContent {
  content_id: number;
  title: string;
  first_image: string;
  addr1: string;
  mapx: string;
  mapy: string;
  overview: string;
  hashtags: string;
  recommend_reason: string;
  created_at: string;
}
export const travelService = {
  // 기존 함수
  fetchTrips: () => apiClient.get('/trips'),
  createTrip: (data: any) => apiClient.post('/trips', data),
  
  // 위치 기반 지역 조회
  getRegionArea: async (lat: number, lon: number) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.get(`/users/find-region/?lat=${lat}&lon=${lon}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },

  // 여행 생성 (토큰 필요)
  createTripWithAuth: async (region: string, transportation: string, companion:string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.post(
      '/users/trips/',
      { region, transportation, companion },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },

  /**
   * 신규 함수: 여행 정보 조회 (토큰 필요)
   * 사용자의 모든 여행 목록을 조회합니다.
   * @returns Promise<Trip[]> - 여행 객체의 배열을 반환합니다.
   */
  getTripData: async (): Promise<Trip[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    try {
      const res = await apiClient.get<Trip[]>(
        '/users/trips/',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      return res.data;
    } catch (err: any) {
      console.error('❌ 여행 정보 조회 실패:', err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * *** 신규 함수: 사용자가 방문한 모든 콘텐츠(장소) 목록을 조회합니다. ***
   * @returns Promise<VisitedContent[]> - 방문한 장소 객체의 배열을 반환합니다.
   */
  getVisitedContents: async (): Promise<VisitedContent[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    try {
      // API 명세에 맞는 엔드포인트로 요청
      const res = await apiClient.get<VisitedContent[]>(
        '/users/visited-contents/',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      return res.data;
    } catch (err: any) {
      console.error('❌ 방문한 콘텐츠 조회 실패:', err.response?.data || err.message);
      throw err;
    }
  },

  getVisitedContentsByTrip: async (tripId: number): Promise<VisitedContent[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    try {
        const res = await apiClient.get<VisitedContent[]>(
        `/users/visited-contents/?trip=${tripId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      // *** 핵심: res.data를 직접 반환하도록 수정 ***
      return res.data;
    } catch(err: any) {
        console.error(`❌ Trip ID ${tripId}의 방문 콘텐츠 조회 실패:`, err.response?.data || err.message);
        throw err;
    }
  },

};