import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useSurvey,
  usePatchSurvey,
  useAddQuestion,
  usePatchQuestion,
  useDeleteQuestion,
  useReorderQuestions,
} from "../../features/surveys/hooks";
import type { QuestionType, Survey } from "../../features/surveys/types";

/* ---------------- helpers ---------------- */

function nextOrderFor(s: Survey) {
  if (!s.questions?.length) return 10;
  const max = Math.max(...s.questions.map((q) => q.order ?? 0));
  return max + 10;
}

const DEFAULT_PROMPTS = {
  scale5: {
    fi: "Kuinka tyytyväinen olit käyntiisi?",
    en: "How satisfied were you with your visit?",
    sv: "Hur nöjd var du med ditt besök?",
  },
  boolean: {
    fi: "Oliko henkilökunta ystävällinen?",
    en: "Was the staff friendly?",
    sv: "Var personalen vänlig?",
  },
  text: {
    fi: "Kirjoita tähän…",
    en: "Write here…",
    sv: "Skriv här…",
  },
} as const;

function makeDefaultQuestion(type: "scale5" | "boolean" | "text", order: number) {
  if (type === "text") {
    return {
      type: "text",
      prompt: { ...DEFAULT_PROMPTS.text },
      required: false,
      order,
      maxLength: 1000,
    };
  }
  if (type === "boolean") {
    return {
      type: "boolean",
      prompt: { ...DEFAULT_PROMPTS.boolean },
      required: false,
      order,
    };
  }
  return {
    type: "scale5",
    prompt: { ...DEFAULT_PROMPTS.scale5 },
    required: true,
    order,
    min: 1,
    max: 5,
  };
}

/* ---------------- tiny UI bits ---------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
      {children}
    </span>
  );
}

function Section({
  title,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`bg-white border border-zinc-200 rounded-2xl shadow-sm ${className}`}>
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200/80 sticky top-0 bg-white rounded-t-2xl z-10">
        <h2 className="font-medium text-zinc-900">{title}</h2>
      </div>
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

function PromptEditor({
  value,
  onChange,
}: {
  value: { fi: string; en: string; sv: string };
  onChange: (v: { fi: string; en: string; sv: string }) => void;
}) {
  const [tab, setTab] = useState<"fi" | "en" | "sv">("fi");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["fi", "en", "sv"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setTab(l)}
            className={`px-2 py-1 rounded border text-sm transition ${
              tab === l
                ? "bg-amber-50 border-amber-200 text-zinc-900"
                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <textarea
        rows={4}
        className="w-full rounded-lg bg-white border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        value={value[tab]}
        onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
        placeholder={`Kirjoita kysymysteksti (${tab.toUpperCase()})…`}
      />
      <div className="text-xs text-zinc-500 flex gap-3">
        {(["fi", "en", "sv"] as const).map((l) => (
          <span key={l} className={value[l]?.trim() ? "text-emerald-600" : "text-amber-600"}>
            {l.toUpperCase()}: {value[l]?.trim() ? "OK" : "Puuttuu"}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function SurveyBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const navigate = useNavigate();

  // data + mutations
  const surveyQ = useSurvey(id);
  const patchSurvey = usePatchSurvey(id);
  const addQuestion = useAddQuestion(id);
  const deleteQuestion = useDeleteQuestion(id);
  const reorderQuestions = useReorderQuestions(id);

  const qc = useQueryClient();

  // local state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // debounced-draft state for selected question's prompt
  const survey: Survey | null = surveyQ.data ?? null;
  const questionsSorted = useMemo(
    () => (survey?.questions ? [...survey.questions].sort((a, b) => a.order - b.order) : []),
    [survey?.questions]
  );
  const selectedQ = questionsSorted.find((q) => q._id === selectedId);
  const patchQ = usePatchQuestion(id, selectedQ?._id ?? "noop");

  const [promptDraft, setPromptDraft] = useState<{ fi: string; en: string; sv: string } | null>(
    selectedQ?.prompt ?? null
  );
  const [isTypingSave, setIsTypingSave] = useState(false);

  // keep title input in sync
  useEffect(() => {
    setTitleDraft(survey?.title ?? "");
  }, [survey?.title]);

  // when selection changes, reset promptDraft
  useEffect(() => {
    setPromptDraft(selectedQ?.prompt ?? null);
    setIsTypingSave(false);
  }, [selectedId, selectedQ?._id]);

  // debounce patch for promptDraft (2s after last keystroke)
  useEffect(() => {
    if (!selectedQ || !promptDraft) return;

    // if nothing changed, skip
    const original = selectedQ.prompt;
    const changed =
      original.fi !== promptDraft.fi ||
      original.en !== promptDraft.en ||
      original.sv !== promptDraft.sv;

    if (!changed) return;

    setIsTypingSave(true);
    const t = setTimeout(() => {
      patchQ.mutate(
        { prompt: promptDraft },
        {
          onSettled: () => setIsTypingSave(false),
        }
      );
    }, 2000);

    return () => clearTimeout(t);
  }, [promptDraft, selectedQ?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd(type: QuestionType) {
    if (!survey) return;
    const payload = makeDefaultQuestion(type, nextOrderFor(survey));

    addQuestion.mutate(payload, {
      onSuccess: (res) => {
        const updated = (res as any)?.survey ?? res;
        qc.setQueryData(["survey", id], updated);

        const newest = [...updated.questions].sort((a: any, b: any) => b.order - a.order)[0];
        setSelectedId(newest?._id ?? null);
      },
    });
  }

  function handleDelete(qid: string) {
    if (!window.confirm("Poistetaanko tämä kysymys?")) return;

    const current = surveyQ.data;
    const remaining = (current?.questions ?? [])
      .filter((qq) => qq._id !== qid)
      .sort((a, b) => a.order - b.order);

    const changes = remaining.map((qq, i) => ({
      _id: qq._id,
      order: (i + 1) * 10,
    }));

    deleteQuestion.mutate(qid, {
      onSuccess: () => {
        if (selectedId === qid) setSelectedId(null);
        if (changes.length) {
          reorderQuestions.mutate(changes);
        }
      },
    });
  }

  const isActive = !!survey?.isActive;

  return (
    <>
      {/* TOP BAR — unchanged */}
      <div className="border-b border-line/70 w-full py-3 px-8 flex flex-row items-center justify-between bg-white">
        <div className="flex items-center gap-10">
          {/* back arrow */}
          <button
            className="items-center px-2 py-2 rounded-lg border border-zinc-300 text-zinc-800 hover:bg-zinc-50"
            onClick={() => navigate("/hallinta/kyselyt")}
            aria-label="Takaisin kyselyihin"
            title="Takaisin kyselyihin"
          >
            <ArrowLeft size={18} />
          </button>
          {/* inline editable title */}
          <input
            className="w-[420px] bg-white border border-black rounded-lg px-3 py-2 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Kyselyn otsikko…"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              const v = titleDraft.trim();
              if (!survey || !v || v === survey.title) return;
              patchSurvey.mutate({ title: v });
            }}
            disabled={surveyQ.isLoading || surveyQ.isError || !survey}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* version pill */}
          {survey && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              v{survey.version}
            </span>
          )}

          {/* active/draft badge */}
          {survey && (
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              {isActive ? "aktiivinen" : "luonnos"}
            </span>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      {/* 2 / 5 / 5 with prominent sticky inspector */}
      <div className="p-4 grid grid-cols-12 gap-4">
        {/* Left: add buttons (narrow) */}
        <div className="col-span-2 space-y-4">
          <Section title="Lisää kysymys">
            <div className="grid gap-2">
              <button
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-800 hover:bg-amber-50 transition"
                onClick={() => handleAdd("scale5")}
                disabled={!survey}
              >
                + Asteikko 1–5
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-800 hover:bg-amber-50 transition"
                onClick={() => handleAdd("boolean")}
                disabled={!survey}
              >
                + Kyllä / Ei
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-800 hover:bg-amber-50 transition"
                onClick={() => handleAdd("text")}
                disabled={!survey}
              >
                + Teksti
              </button>
            </div>
          </Section>
        </div>

        {/* Center: list of questions */}
        <div className="col-span-5 space-y-4">
          <Section title="Kysymykset">
            {surveyQ.isLoading && <div className="text-zinc-600">Ladataan…</div>}
            {surveyQ.isError && <div className="text-amber-600">Virhe ladattaessa kyselyä.</div>}
            {survey && (
              <div className="flex flex-col gap-2">
                {questionsSorted.length === 0 && (
                  <div className="text-sm text-zinc-500">Ei kysymyksiä vielä.</div>
                )}
                {questionsSorted.map((q, idx) => (
                  <div
                    key={q._id}
                    className={`group text-left border rounded-xl p-3 bg-white transition hover:bg-amber-50 ${
                      selectedId === q._id
                        ? "border-emerald-300 ring-2 ring-emerald-200"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Sequential number badge */}
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 text-[12px] text-zinc-700">
                        {idx + 1}
                      </span>

                      <button
                        onClick={() => setSelectedId(q._id)}
                        className="flex-1 text-left"
                        title="Muokkaa ominaisuuksia"
                      >
                        <div className="text-sm text-zinc-700">
                          <Badge>{q.type}</Badge>{" "}
                          <span className="ml-2 text-xs text-zinc-500">järj. {idx + 1}</span>
                        </div>
                        <div className="text-zinc-900 mt-1 line-clamp-1">
                          {q.prompt.fi || q.prompt.en || q.prompt.sv || (
                            <span className="text-zinc-500">Ei kysymystekstiä</span>
                          )}
                        </div>
                      </button>

                      {/* Delete */}
                      <button
                        className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 transition"
                        onClick={() => handleDelete(q._id)}
                        disabled={deleteQuestion.isPending || reorderQuestions.isPending}
                        title="Poista kysymys"
                      >
                        Poista
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right: Inspector — prominent & sticky */}
        <div className="col-span-5 self-start sticky top-16">
          <Section
            title="Ominaisuudet"
            className="max-h-[calc(100vh-96px)] overflow-hidden"
            bodyClassName="h-full overflow-auto pr-2"
          >
            {selectedQ ? (
              <div className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-zinc-600">Kysymysteksti</div>
                    {(isTypingSave || patchQ.isPending) && (
                      <div className="text-xs text-zinc-500 inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
                        Tallennetaan…
                      </div>
                    )}
                  </div>
                  {promptDraft && (
                    <PromptEditor
                      value={promptDraft}
                      onChange={(prompt) => setPromptDraft(prompt)}
                    />
                  )}
                </div>

                {/* Basics */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-zinc-800">
                    <input
                      type="checkbox"
                      className="accent-emerald-600"
                      checked={!!selectedQ.required}
                      onChange={(e) => patchQ.mutate({ required: e.target.checked })}
                    />
                    <span className="text-sm">Pakollinen</span>
                  </label>
                </div>

                {/* Type-specific */}
                {selectedQ.type === "text" && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm text-zinc-800">
                      Merkkiraja
                      <input
                        type="number"
                        min={1}
                        className="w-full mt-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedQ.maxLength ?? 1000}
                        onChange={(e) =>
                          patchQ.mutate({ maxLength: Number(e.target.value || 1000) })
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedQ.type === "scale5" && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm text-zinc-800">
                      Min (1–5)
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="w-full mt-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedQ.min ?? 1}
                        onChange={(e) => patchQ.mutate({ min: Number(e.target.value || 1) })}
                      />
                    </label>
                    <label className="text-sm text-zinc-800">
                      Max (1–5)
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="w-full mt-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedQ.max ?? 5}
                        onChange={(e) => patchQ.mutate({ max: Number(e.target.value || 5) })}
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[40vh] grid place-items-center text-center">
                <div>
                  <div className="text-zinc-900 font-medium">Ei valittua kysymystä</div>
                  <div className="text-zinc-500 text-sm mt-1">
                    Valitse kysymys keskeltä nähdäksesi sen ominaisuudet.
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}