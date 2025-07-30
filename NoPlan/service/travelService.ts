// service/travelService.ts

import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';

/**
 * 여행 객체 타입
 */
export interface Trip {
  id: number;
  region: string;
  created_at: string;
}

/**
 * 서버에서 받아오는 방문한 콘텐츠 객체 타입
 */
export interface VisitedContent {
  id: number;                // 서버가 부여하는 방문 콘텐츠 고유 ID
  user: string;              // 사용자 식별자 (이메일 등)
  trip: number;              // 해당 콘텐츠가 속한 trip ID
  content_id: number;        // 관광 API에서 받은 콘텐츠 ID
  title: string;             // 콘텐츠 제목
  first_image: string;       // 대표 이미지 URL
  addr1: string;             // 주소
  mapx: string;              // 경도
  mapy: string;              // 위도
  overview: string;          // 간략 설명
  hashtags: string;          // 해시태그 문자열 (예: "#역사#문화")
  recommend_reason: string;  // 추천 이유
  created_at: string;        // 등록 일시
}

/**
 * 신규 생성 요청용 DTO
 */
export interface CreateVisitedContentDto {
  content_id: number;
  title: string;
  first_image: string;
  addr1: string;
  mapx: string;
  mapy: string;
  overview: string;
  hashtags?: string;
  recommend_reason?: string;
}

export const travelService = {
  // --------------------------
  // (1) Trip 관련 기존 API
  // --------------------------
  fetchTrips: () => 
    apiClient.get<Trip[]>('/trips'),

  createTrip: (data: { region: string; transportation: string; companion: string }) =>
    apiClient.post('/trips', data),

  getRegionArea: async (lat: number, lon: number) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.get(
      `/users/find-region/?lat=${lat}&lon=${lon}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },

  createTripWithAuth: async (region: string, transportation: string, companion: string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.post(
      '/users/trips/',
      { region, transportation, companion },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },

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

  // ---------------------------------------
  // (2) VisitedContent 관련 신규/확장 API
  // ---------------------------------------

  /**
   * 사용자가 방문한 모든 콘텐츠를 조회합니다.
   */
  getVisitedContents: async (): Promise<VisitedContent[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    try {
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

  /**
   * 특정 trip에 속한 방문 콘텐츠만 조회합니다.
   */
  getVisitedContentDataByTrip: async (tripId: number): Promise<VisitedContent[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    const url = `/users/visited-contents/?trip=${tripId}`;
    console.log(`[travelService] GET ${url}`);           // ← 요청 URL 로그
    try {
      const res = await apiClient.get<VisitedContent[]>(
        url,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('[travelService] response.data:', res.data);  // ← 응답 데이터 로그
      return res.data;
    } catch (err: any) {
      console.error(`❌ trip=${tripId} 방문 콘텐츠 조회 실패:`, err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * 신규: 사용자가 특정 trip에 방문한 콘텐츠를 추가(POST)합니다.
   * @param tripId 해당 trip의 ID
   * @param data   CreateVisitedContentDto 타입의 콘텐츠 정보
   */
  createVisitedContent: async (
    tripId: number,
    data: CreateVisitedContentDto
  ): Promise<VisitedContent> => {
    const token = await SecureStore.getItemAsync('accessToken');
    try {
      const payload = { trip: tripId, ...data };
      const res = await apiClient.post<VisitedContent>(
        '/users/visited-contents/',
        payload,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      return res.data;
    } catch (err: any) {
      console.error('❌ 방문 콘텐츠 추가 실패:', err.response?.data || err.message);
      throw err;
    }
  },
};
