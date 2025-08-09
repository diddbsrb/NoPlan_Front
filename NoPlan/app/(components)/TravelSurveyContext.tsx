import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const TravelSurveyContext = createContext<TravelSurveyContextType | undefined>(undefined);

export function TravelSurveyProvider({ children }: { children: ReactNode }) {
  const [survey, setSurveyState] = useState<TravelSurveyData>({});
  const setSurvey = (data: TravelSurveyData) => {
    console.log('[TravelSurveyContext] setSurvey called with:', data);
    setSurveyState(data);
  };
  const clearSurvey = () => {
    console.log('[TravelSurveyContext] clearSurvey called');
    setSurveyState({});
  };
  
  console.log('[TravelSurveyContext] Current survey state:', survey);
  
  return (
    <TravelSurveyContext.Provider value={{ survey, setSurvey, clearSurvey }}>
      {children}
    </TravelSurveyContext.Provider>
  );
}

export function useTravelSurvey() {
  const ctx = useContext(TravelSurveyContext);
  if (!ctx) throw new Error('useTravelSurvey must be used within TravelSurveyProvider');
  return ctx;
}
