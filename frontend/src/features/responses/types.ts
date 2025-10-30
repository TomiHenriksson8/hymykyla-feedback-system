// src/features/responses/types.ts
export type Answer =
  | { questionId: string; type: 'scale5'; valueNumber: number }
  | { questionId: string; type: 'boolean'; valueBoolean: boolean }
  | { questionId: string; type: 'text'; valueText: string };

export type ResponseItem = {
  _id: string;
  surveyId: string;
  surveyVersion: number;
  submittedAt: string; // ISO
  answers: Answer[];
  createdAt?: string;
  updatedAt?: string;
};

export type ListResponsesParams = {
  surveyId?: string;
  from?: string;      // YYYY-MM-DD or ISO date
  to?: string;        // YYYY-MM-DD or ISO date (inclusive, see BE tweak below)
  limit?: number;     // default 50
  offset?: number;    // default 0
};

export type ListResponsesResult = {
  ok: true;
  items: ResponseItem[];
  total: number;
};
