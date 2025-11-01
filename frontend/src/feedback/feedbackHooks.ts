// frontend/src/feedback/feedbackHooks.ts

import { useMutation } from '@tanstack/react-query';
import { postJSON } from '../lib/api'; // The shared 'postJSON' helper

// 1. Define the types for the data we will send

type AnswerPayload =
  | { questionId: string; type: 'scale5'; valueNumber: number }
  | { questionId: string; type: 'boolean'; valueBoolean: boolean }
  | { questionId: string; type: 'text'; valueText: string };

type SubmitPayload = {
  surveyId: string;
  answers: AnswerPayload[];
};

// 2. Define the actual function that sends the data
async function submitFeedback(payload: SubmitPayload) {
  // We use postJSON to send data to the '/feedback/submit' endpoint
  // The backend will respond with 204 (No Content) on success
  await postJSON('/feedback/submit', payload);
  return { ok: true };
}

// 3. Create a custom "mutation" hook that components can use
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback, // The function to run
  });
}