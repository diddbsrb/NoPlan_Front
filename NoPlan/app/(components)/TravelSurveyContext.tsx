import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { travelService } from '../../service/travelService';



interface TravelSurveyContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  isTraveling: boolean;
  setIsTraveling: (traveling: boolean) => void;
  checkTravelStatus: () => Promise<void>;
  loadSavedStates: () => Promise<void>;
}

const TravelSurveyContext = createContext<TravelSurveyContextType | undefined>(undefined);

export function TravelSurveyProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [isTraveling, setIsTravelingState] = useState(false);


  const setIsLoggedIn = async (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    if (loggedIn) {
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      await checkTravelStatus();
    } else {
      await SecureStore.setItemAsync('isLoggedIn', 'false');
      setIsTravelingState(false);
      await SecureStore.setItemAsync('isTraveling', 'false');
    }
  };

  const setIsTraveling = async (traveling: boolean) => {
    setIsTravelingState(traveling);
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

      const savedTravelState = await SecureStore.getItemAsync('isTraveling');
      
      if (savedTravelState === 'true') {
        const trips = await travelService.getTripData();
        if (trips && trips.length > 0) {
          const latestTrip = trips.sort((a, b) => b.id - a.id)[0];
          
          if (latestTrip.summary === null || latestTrip.summary === undefined) {
            console.log('[TravelSurveyContext] 여행 상태 확인: 여행 중으로 설정');
            setIsTravelingState(true);
            await SecureStore.setItemAsync('isTraveling', 'true');
            return;
          } else {
            console.log('[TravelSurveyContext] 여행 상태 확인: 여행 완료로 설정');
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
      const savedLoginState = await SecureStore.getItemAsync('isLoggedIn');
      const savedTravelState = await SecureStore.getItemAsync('isTraveling');
      
      if (savedLoginState === 'true') {
        setIsLoggedInState(true);
        console.log('[TravelSurveyContext] 저장된 로그인 상태: 로그인됨');
        
        if (savedTravelState === 'true') {
          setIsTravelingState(true);
          console.log('[TravelSurveyContext] 저장된 여행 상태: 여행 중');
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
      setIsLoggedInState(false);
      setIsTravelingState(false);
    }
  };

  useEffect(() => {
    loadSavedStates();
  }, []);
  
  return (
    <TravelSurveyContext.Provider value={{ 
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
