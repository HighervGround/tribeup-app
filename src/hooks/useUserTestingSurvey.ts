import { useState, useCallback } from 'react';

export type SurveyTrigger = 'onboarding' | 'game_creation' | 'game_join' | 'general';

interface UseUserTestingSurveyReturn {
  isSurveyOpen: boolean;
  triggerContext: SurveyTrigger;
  openSurvey: (context?: SurveyTrigger) => void;
  closeSurvey: () => void;
}

export function useUserTestingSurvey(): UseUserTestingSurveyReturn {
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [triggerContext, setTriggerContext] = useState<SurveyTrigger>('general');

  const openSurvey = useCallback((context: SurveyTrigger = 'general') => {
    setTriggerContext(context);
    setIsSurveyOpen(true);
  }, []);

  const closeSurvey = useCallback(() => {
    setIsSurveyOpen(false);
  }, []);

  return {
    isSurveyOpen,
    triggerContext,
    openSurvey,
    closeSurvey
  };
}
