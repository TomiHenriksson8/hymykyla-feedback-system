// frontend/src/features/surveys/publicHooks.ts

import { useQuery } from '@tanstack/react-query';
import { getJSON } from '../../lib/api'; // The shared 'getJSON' helper
import type { Survey } from './types'; // We can re-use the 'Survey' type

// 1. Define the type for the API response
type ActiveSurveyResponse = {
  ok: true;
  survey: Survey;
};

// 2. Define the actual function that fetches the data
async function fetchActiveSurvey(): Promise<Survey> {
  const data = await getJSON<ActiveSurveyResponse>('/public/active-survey');
  return data.survey; 
}

// 3. Create a custom "hook" that components can use
export function useActiveSurvey() {
  return useQuery({
    queryKey: ['public', 'active-survey'], // A unique key for caching
    queryFn: fetchActiveSurvey, // The function to run
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}