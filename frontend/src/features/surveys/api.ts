import { deleteReq, getJSON, patchJSON, postJSON, putJSON } from "../../lib/api";
import type { Survey, Question } from "./types";

const BASE = "/surveys";

/* ---------------- helpers to normalize shapes ---------------- */
function listFrom(data: any): Survey[] {
  if (Array.isArray(data)) return data as Survey[];
  if (Array.isArray(data?.items)) return data.items as Survey[];
  if (Array.isArray(data?.surveys)) return data.surveys as Survey[];
  return [];
}

function surveyFrom(data: any): Survey | null {
  return (data?.survey as Survey) ?? null;
}

function qs(params?: Record<string, any>): string {
  if (!params || !Object.keys(params).length) return "";
  return "?" + new URLSearchParams(params as any).toString();
}

/* ---------------- queries ---------------- */
export const fetchSurveys = async (params?: Record<string, any>): Promise<Survey[]> => {
  const data = await getJSON<any>(`${BASE}${qs(params)}`).catch(() => null);
  return listFrom(data);
};

export const fetchActive = async (): Promise<Survey[]> => {
  const data = await getJSON<any>(`${BASE}/active`).catch(() => null);
  return listFrom(data);
};

export const fetchSurvey = async (id: string): Promise<Survey | null> => {
  const data = await getJSON<any>(`${BASE}/${id}`).catch(() => null);
  return surveyFrom(data);
};

/* -------------- survey mutations -------------- */
export const createSurvey = async (payload: Omit<Survey, "_id">): Promise<Survey> => {
  const data = await postJSON<any>(BASE, payload);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed createSurvey response");
  return s;
};

export const duplicateSurvey = async (
  id: string,
  body: { title?: string; version: number; isActive?: boolean }
): Promise<Survey> => {
  const data = await postJSON<any>(`${BASE}/${id}/duplicate`, body);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed duplicateSurvey response");
  return s;
};

export const patchSurvey = async (id: string, patch: Partial<Survey>): Promise<Survey> => {
  const data = await patchJSON<any>(`${BASE}/${id}`, patch);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed patchSurvey response");
  return s;
};

export const replaceSurvey = async (id: string, body: Survey): Promise<Survey> => {
  const data = await putJSON<any>(`${BASE}/${id}`, body);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed replaceSurvey response");
  return s;
};

export const deleteSurvey = (id: string) => deleteReq(`${BASE}/${id}`);

export const activateSurvey = async (id: string, exclusive = true): Promise<Survey> => {
  const data = await postJSON<any>(`${BASE}/${id}/activate?exclusive=${exclusive}`);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed activateSurvey response");
  return s;
};

export const deactivateSurvey = async (id: string): Promise<Survey> => {
  const data = await postJSON<any>(`${BASE}/${id}/deactivate`);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed deactivateSurvey response");
  return s;
};

/* -------------- question mutations -------------- */
export const addQuestion = async (id: string, q: Omit<Question, "_id">): Promise<Survey> => {
  const data = await postJSON<any>(`${BASE}/${id}/questions`, q);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed addQuestion response");
  return s;
};

export const patchQuestion = async (
  id: string,
  qid: string,
  patch: Partial<Question>
): Promise<Survey> => {
  const data = await patchJSON<any>(`${BASE}/${id}/questions/${qid}`, patch);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed patchQuestion response");
  return s;
};

export const deleteQuestionApi = (id: string, qid: string) =>
  deleteReq(`${BASE}/${id}/questions/${qid}`);

export const reorderQuestions = async (
  id: string,
  changes: Array<{ _id: string; order: number }>
): Promise<Survey> => {
  const data = await postJSON<any>(`${BASE}/${id}/questions/reorder`, changes);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed reorderQuestions response");
  return s;
};

export const replaceQuestions = async (id: string, questions: Question[]): Promise<Survey> => {
  const data = await putJSON<any>(`${BASE}/${id}/questions`, questions);
  const s = surveyFrom(data);
  if (!s) throw new Error("Malformed replaceQuestions response");
  return s;
};
