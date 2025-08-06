// utils/categoryMapping.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CategoryMapping {
  [contentId: number]: 'restaurants' | 'cafes' | 'attractions' | 'accommodations';
}

export interface VisitedContentWithCategory {
  id: number;
  user: string;
  trip: number;
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
  category?: 'restaurants' | 'cafes' | 'attractions' | 'accommodations';
}

export const categoryMapping = {
  // 카테고리 매핑 저장
  saveCategory: async (contentId: number, category: string) => {
    try {
      const existing = await AsyncStorage.getItem('categoryMapping');
      const mapping: CategoryMapping = existing ? JSON.parse(existing) : {};
      mapping[contentId] = category as any;
      await AsyncStorage.setItem('categoryMapping', JSON.stringify(mapping));
      console.log(`[categoryMapping] 카테고리 저장: ${contentId} -> ${category}`);
    } catch (e) {
      console.error('카테고리 매핑 저장 실패:', e);
    }
  },

  // 카테고리 매핑 조회
  getCategory: async (contentId: number): Promise<string | null> => {
    try {
      const existing = await AsyncStorage.getItem('categoryMapping');
      const mapping: CategoryMapping = existing ? JSON.parse(existing) : {};
      return mapping[contentId] || null;
    } catch (e) {
      console.error('카테고리 매핑 조회 실패:', e);
      return null;
    }
  },

  // 방문한 콘텐츠들의 카테고리 조회
  getVisitedCategories: async (visitedContents: any[]): Promise<VisitedContentWithCategory[]> => {
    const categories = await Promise.all(
      visitedContents.map(async (content) => {
        const category = await categoryMapping.getCategory(content.content_id);
        return { ...content, category };
      })
    );
    return categories;
  },

  // 카테고리 판단 함수
  determineCategory: (title: string, reason: string): string => {
    const text = (title + ' ' + reason).toLowerCase();
    
    if (text.includes('식당') || text.includes('레스토랑') || text.includes('맛집') || 
        text.includes('음식') || text.includes('밥') || text.includes('식사') ||
        text.includes('한식') || text.includes('중식') || text.includes('일식') ||
        text.includes('양식') || text.includes('분식')) {
      return 'restaurants';
    }
    if (text.includes('카페') || text.includes('커피') || text.includes('음료') ||
        text.includes('스타벅스') || text.includes('투썸') || text.includes('할리스')) {
      return 'cafes';
    }
    if (text.includes('호텔') || text.includes('숙소') || text.includes('펜션') || 
        text.includes('모텔') || text.includes('게스트하우스') || text.includes('리조트') ||
        text.includes('캠핑') || text.includes('민박')) {
      return 'accommodations';
    }
    // 기본값은 관광지
    return 'attractions';
  }
}; 