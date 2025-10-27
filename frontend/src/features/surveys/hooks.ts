import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "./keys";
import * as api from "./api";
import type { Survey, Question } from "./types";

/* ---------------- queries ---------------- */
export function useSurveys(params?: Record<string, any>) {
  return useQuery<Survey[]>({
    queryKey: qk.list(params),
    staleTime: 60_000,
    queryFn: () => api.fetchSurveys(params),
    // keeps old data while fetching new to avoid UI flicker
    placeholderData: (prev) => prev ?? [],
  });
}

export function useActiveSurveys() {
  return useQuery<Survey[]>({
    queryKey: qk.active,
    staleTime: 60_000,
    queryFn: () => api.fetchActive(),
    placeholderData: (prev) => prev ?? [],
  });
}

export function useSurvey(id?: string) {
  return useQuery<Survey | null>({
    queryKey: id ? qk.one(id) : ["survey", "none"],
    enabled: !!id,               // don’t run without id
    queryFn: () => api.fetchSurvey(id!), // returns Survey | null (never undefined)
  });
}

/* ---------------- survey mutations ---------------- */
export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSurvey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
}

export function usePatchSurvey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Survey>) => api.patchSurvey(id, patch),
    onSuccess: (s) => {
      qc.setQueryData(qk.one(id), s);
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
}

export function useReplaceSurvey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Survey) => api.replaceSurvey(id, body),
    onSuccess: (s) => {
      qc.setQueryData(qk.one(id), s);
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
    },
  });
}

export function useDeleteSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSurvey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
}

export function useActivateSurvey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exclusive = true) => api.activateSurvey(id, exclusive),
    onSuccess: (s) => {
      qc.setQueryData(qk.one(id), s);
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
}

export function useDeactivateSurvey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deactivateSurvey(id),
    onSuccess: (s) => {
      qc.setQueryData(qk.one(id), s);
      qc.invalidateQueries({ queryKey: ["surveys"], exact: false });
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
}

/* ---------------- question mutations ---------------- */
export function useAddQuestion(surveyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (q: Omit<Question, "_id">) => api.addQuestion(surveyId, q),
    onSuccess: (s) => qc.setQueryData(qk.one(surveyId), s),
  });
}

export function usePatchQuestion(surveyId: string, qid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Question>) =>
      api.patchQuestion(surveyId, qid, patch),
    onSuccess: (s) => qc.setQueryData(qk.one(surveyId), s),
  });
}

export function useDeleteQuestion(surveyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qid: string) => api.deleteQuestionApi(surveyId, qid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.one(surveyId) });
    },
  });
}

export function useReorderQuestions(surveyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (changes: Array<{ _id: string; order: number }>) =>
      api.reorderQuestions(surveyId, changes),
    onMutate: async (changes) => {
      await qc.cancelQueries({ queryKey: qk.one(surveyId) });
      const prev = qc.getQueryData<Survey>(qk.one(surveyId));
      if (prev) {
        const nextQs = prev.questions
          .map((q) => ({
            ...q,
            order: changes.find((c) => c._id === q._id)?.order ?? q.order,
          }))
          .sort((a, b) => a.order - b.order);
        qc.setQueryData(qk.one(surveyId), { ...prev, questions: nextQs });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.one(surveyId), ctx.prev);
    },
    onSuccess: (s) => qc.setQueryData(qk.one(surveyId), s),
  });
}

/* ---------------- helpers (optional) ---------------- */
export function computeReindexChanges(questions: Question[]) {
  return [...questions]
    .sort((a, b) => a.order - b.order)
    .map((q, idx) => ({ _id: q._id, order: (idx + 1) * 10 }));
}

export function makeDefaultQuestion(nextOrder = 10): Omit<Question, "_id"> {
  return {
    type: "scale5",
    prompt: { fi: "", en: "", sv: "" },
    required: true,
    order: nextOrder,
    min: 1,
    max: 5,
  };
}
