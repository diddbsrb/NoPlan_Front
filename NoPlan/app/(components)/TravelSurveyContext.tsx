import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface TravelSurveyData {
  mapX?: number;
  mapY?: number;
  radius?: number;
  adjectives?: string;
  region?: string;
  transportation?: string;
  companion?: string;
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
    console.log('[TravelSurveyContext] setSurvey request body:', data);
    setSurveyState(data);
  };
  const clearSurvey = () => setSurveyState({});
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
