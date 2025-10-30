import { getJSON } from "../../lib/api";

/* ------------ types (frontend view) ------------ */
export type AnswerType = "scale5" | "boolean" | "text";

export type Answer = {
  questionId: string;            // ObjectId as string
  type: AnswerType;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueText?: string;
};

export type ResponseItem = {
  _id: string;
  surveyId: string;              // ObjectId as string
  surveyVersion: number;
  submittedAt: string;           // ISO
  answers: Answer[];
  createdAt?: string;
  updatedAt?: string;
};

export type ListResponsesParams = {
  limit?: number;
  offset?: number;
  surveyId?: string;
  from?: string;                 // "YYYY-MM-DD" or ISO
  to?: string;                   // "YYYY-MM-DD" or ISO
};

/* --------------- helpers ---------------- */
const BASE = "/responses";

function qs(params?: Record<string, any>): string {
  if (!params || !Object.keys(params).length) return "";
  return "?" + new URLSearchParams(params as any).toString();
}

function itemsFrom(data: any): ResponseItem[] {
  if (Array.isArray(data?.items)) return data.items as ResponseItem[];
  if (Array.isArray(data)) return data as ResponseItem[];
  return [];
}

function totalFrom(data: any): number {
  if (typeof data?.total === "number") return data.total;
  return itemsFrom(data).length;
}

/* --------------- queries ---------------- */
export const fetchResponses = async (
  params?: ListResponsesParams
): Promise<{ items: ResponseItem[]; total: number }> => {
  const data = await getJSON<any>(`${BASE}${qs(params)}`).catch(() => null);
  return {
    items: itemsFrom(data),
    total: totalFrom(data),
  };
};
