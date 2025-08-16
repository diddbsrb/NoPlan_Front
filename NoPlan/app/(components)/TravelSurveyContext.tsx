import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { travelService } from '../../service/travelService';

export interface TravelSurveyData {
  mapX?: number;
  mapY?: number;
  radius?: number;
  adjectives?: string;
  region?: string;
  transportation?: string;
  companion?: string;
  autoRecommendType?: 'restaurants' | 'cafes' | 'attractions' | 'accommodations';
}

interface TravelSurveyContextType {
  survey: TravelSurveyData;
  setSurvey: (data: TravelSurveyData) => void;
  clearSurvey: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  isTraveling: boolean;
  setIsTraveling: (traveling: boolean) => void;
  checkTravelStatus: () => Promise<void>;
  loadSavedStates: () => Promise<void>;
}

const TravelSurveyContext = createContext<TravelSurveyContextType | undefined>(undefined);

export function TravelSurveyProvider({ children }: { children: ReactNode }) {
  const [survey, setSurveyState] = useState<TravelSurveyData>({});
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [isTraveling, setIsTravelingState] = useState(false);

  const setSurvey = (data: TravelSurveyData) => {
    setSurveyState(data);
  };

  const clearSurvey = () => {
    setSurveyState({});
  };

  const setIsLoggedIn = async (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    // SecureStore에 로그인 상태 저장
    if (loggedIn) {
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      // 로그인 시 여행 상태 확인
      await checkTravelStatus();
    } else {
      await SecureStore.setItemAsync('isLoggedIn', 'false');
      // 로그아웃 시 여행 상태도 false로 설정
      setIsTravelingState(false);
      await SecureStore.setItemAsync('isTraveling', 'false');
    }
  };

  const setIsTraveling = async (traveling: boolean) => {
    setIsTravelingState(traveling);
    // SecureStore에 여행 상태 저장
    await SecureStore.setItemAsync('isTraveling', traveling ? 'true' : 'false');
  };

  const checkTravelStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (!accessToken) {
        setIsTravelingState(false);
        await SecureStore.setItemAsync('isTraveling', 'false');
        return;
      }

      // 🆕 저장된 여행 상태 확인
      const savedTravelState = await SecureStore.getItemAsync('isTraveling');
      
      // 🆕 isTraveling이 true인 경우에만 여행 정보 확인
      if (savedTravelState === 'true') {
        const trips = await travelService.getTripData();
        if (trips && trips.length > 0) {
          const latestTrip = trips.sort((a, b) => b.id - a.id)[0];
          
          // 🆕 summary가 null이면 여행 중, summary가 있으면 여행 완료
          if (latestTrip.summary === null || latestTrip.summary === undefined) {
            console.log('[TravelSurveyContext] 여행 상태 확인: isTraveling=true이고 summary가 null이므로 여행 중으로 설정');
            setIsTravelingState(true);
            await SecureStore.setItemAsync('isTraveling', 'true');
            return;
          } else {
            console.log('[TravelSurveyContext] 여행 상태 확인: isTraveling=true이지만 summary가 있으므로 여행 완료로 설정');
            setIsTravelingState(false);
            await SecureStore.setItemAsync('isTraveling', 'false');
            return;
          }
        }
      }
      
      console.log('[TravelSurveyContext] 여행 중이 아님');
      setIsTravelingState(false);
      await SecureStore.setItemAsync('isTraveling', 'false');
    } catch (error) {
      console.error('[TravelSurveyContext] 여행 상태 확인 실패:', error);
      setIsTravelingState(false);
      await SecureStore.setItemAsync('isTraveling', 'false');
    }
  };

  const loadSavedStates = async () => {
    try {
      // 저장된 로그인 상태 불러오기
      const savedLoginState = await SecureStore.getItemAsync('isLoggedIn');
      const savedTravelState = await SecureStore.getItemAsync('isTraveling');
      
      if (savedLoginState === 'true') {
        setIsLoggedInState(true);
        console.log('[TravelSurveyContext] 저장된 로그인 상태: 로그인됨');
        
        // 여행 상태 확인 및 로깅
        if (savedTravelState === 'true') {
          setIsTravelingState(true);
          console.log('[TravelSurveyContext] 저장된 여행 상태: 여행 중');
          
          // 여행 중인 경우 최신 여행 정보를 가져와서 survey 상태 업데이트 시도
          try {
            const trips = await travelService.getTripData();
            if (trips && trips.length > 0) {
              const latestTrip = trips.sort((a, b) => b.id - a.id)[0];
              console.log('[TravelSurveyContext] 최신 여행 정보 발견:', {
                id: latestTrip.id,
                region: latestTrip.region,
                transportation: latestTrip.transportation,
                companion: latestTrip.companion,
                adjectives: latestTrip.adjectives
              });
            }
          } catch (tripError) {
            console.error('[TravelSurveyContext] 여행 정보 조회 실패:', tripError);
          }
        } else {
          setIsTravelingState(false);
          console.log('[TravelSurveyContext] 저장된 여행 상태: 여행 중 아님');
        }
      } else {
        setIsLoggedInState(false);
        setIsTravelingState(false);
        console.log('[TravelSurveyContext] 저장된 로그인 상태: 로그아웃됨');
      }
    } catch (error) {
      console.error('[TravelSurveyContext] 저장된 상태 불러오기 실패:', error);
      // 에러 발생 시 기본값으로 설정
      setIsLoggedInState(false);
      setIsTravelingState(false);
    }
  };

  useEffect(() => {
    loadSavedStates();
  }, []);
  
  return (
    <TravelSurveyContext.Provider value={{ 
      survey, 
      setSurvey, 
      clearSurvey, 
      isLoggedIn,
      setIsLoggedIn,
      isTraveling, 
      setIsTraveling, 
      checkTravelStatus,
      loadSavedStates
    }}>
      {children}
    </TravelSurveyContext.Provider>
  );
}

export function useTravelSurvey() {
  const ctx = useContext(TravelSurveyContext);
  if (!ctx) throw new Error('useTravelSurvey must be used within TravelSurveyProvider');
  return ctx;
}
