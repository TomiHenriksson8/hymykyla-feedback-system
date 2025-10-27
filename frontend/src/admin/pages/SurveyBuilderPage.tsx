import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  useSurvey,
  usePatchSurvey,
  useAddQuestion,
  usePatchQuestion,
} from "../../features/surveys/hooks";
import type { Question, QuestionType, Survey } from "../../features/surveys/types";

/* ---------------- helpers ---------------- */

function nextOrderFor(s: Survey) {
  if (!s.questions?.length) return 10;
  const max = Math.max(...s.questions.map((q) => q.order ?? 0));
  return max + 10;
}

function makeDefaultQuestion(type: QuestionType, order: number): Omit<Question, "_id"> {
  if (type === "text") {
    return {
      type: "text",
      prompt: { fi: "", en: "", sv: "" },
      required: false,
      order,
      maxLength: 1000,
    };
  }
  if (type === "boolean") {
    return {
      type: "boolean",
      prompt: { fi: "", en: "", sv: "" },
      required: false,
      order,
    };
  }
  return {
    type: "scale5",
    prompt: { fi: "", en: "", sv: "" },
    required: true,
    order,
    min: 1,
    max: 5,
  };
}

/* -------------- small UI bits -------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
      <div className="mb-3 font-medium text-zinc-900">{title}</div>
      {children}
    </div>
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
    <div className="space-y-2">
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
        rows={3}
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

/* -------------- main page (simplified, no DnD) -------------- */

export default function SurveyBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const surveyQ = useSurvey(id);
  const patchSurvey = usePatchSurvey(id);
  const addQuestion = useAddQuestion(id);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const survey: Survey | null = surveyQ.data ?? null;
  const questionsSorted = useMemo(
    () => (survey?.questions ? [...survey.questions].sort((a, b) => a.order - b.order) : []),
    [survey?.questions]
  );

  const selectedQ = questionsSorted.find((q) => q._id === selectedId);
  const patchQ = usePatchQuestion(id, selectedQ?._id ?? "noop");

  function handleAdd(type: QuestionType) {
    if (!survey) return;
    const payload = makeDefaultQuestion(type, nextOrderFor(survey));
    addQuestion.mutate(payload, {
      onSuccess: (s) => {
        const newest = [...s.questions].sort((a, b) => b.order - a.order)[0];
        setSelectedId(newest?._id ?? null);
      },
    });
  }

  return (
    <div className="p-6 grid grid-cols-12 gap-4">
      {/* Left: Survey meta & add buttons */}
      <div className="col-span-3 space-y-4">
        <Section title="Kysely">
          {surveyQ.isLoading && <div className="text-zinc-600">Ladataan…</div>}
          {surveyQ.isError && <div className="text-amber-600">Virhe ladattaessa kyselyä.</div>}
          {survey && (
            <>
              <label className="text-sm text-zinc-700">
                Otsikko
                <input
                  className="w-full mt-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue={survey.title}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== survey.title) patchSurvey.mutate({ title: v });
                  }}
                  placeholder="Kyselyn otsikko…"
                />
              </label>
              <div className="mt-2 text-xs text-zinc-600">
                Versio{" "}
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {survey.version}
                </span>{" "}
                •{" "}
                {survey.isActive ? (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    aktiivinen
                  </span>
                ) : (
                  <Badge>luonnos</Badge>
                )}
              </div>
            </>
          )}
        </Section>

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

      {/* Center: Simple list of questions */}
      <div className="col-span-6 space-y-4">
        <Section title="Kysymykset">
          {!survey && !surveyQ.isLoading && (
            <div className="text-sm text-zinc-500">Ei ladattua kyselyä.</div>
          )}
          {survey && (
            <div className="flex flex-col gap-2">
              {questionsSorted.length === 0 && (
                <div className="text-sm text-zinc-500">Ei kysymyksiä vielä.</div>
              )}
              {questionsSorted.map((q) => (
                <button
                  key={q._id}
                  onClick={() => setSelectedId(q._id)}
                  className={`text-left border rounded-xl p-3 bg-white transition hover:bg-amber-50 ${
                    selectedId === q._id
                      ? "border-emerald-300 ring-2 ring-emerald-200"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-zinc-700">
                      <Badge>{q.type}</Badge>{" "}
                      <span className="ml-2 text-xs text-zinc-500">järj. {q.order}</span>
                    </div>
                  </div>
                  <div className="text-zinc-900 mt-1 line-clamp-1">
                    {q.prompt.fi || q.prompt.en || q.prompt.sv || (
                      <span className="text-zinc-500">Ei kysymystekstiä</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Right: Inspector */}
      <div className="col-span-3">
        <Section title="Ominaisuudet">
          {selectedQ ? (
            <div className="space-y-4">
              <PromptEditor
                value={selectedQ.prompt}
                onChange={(prompt) => patchQ.mutate({ prompt })}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-zinc-800">
                  <input
                    type="checkbox"
                    className="accent-emerald-600"
                    checked={!!selectedQ.required}
                    onChange={(e) => patchQ.mutate({ required: e.target.checked })}
                  />
                  <span className="text-sm">Pakollinen</span>
                </label>

                {selectedQ.type === "text" && (
                  <label className="text-sm text-zinc-800">
                    Merkkiraja
                    <input
                      type="number"
                      min={1}
                      className="w-full mt-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={selectedQ.maxLength ?? 1000}
                      onChange={(e) => patchQ.mutate({ maxLength: Number(e.target.value || 1000) })}
                    />
                  </label>
                )}

                {selectedQ.type === "scale5" && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-zinc-500">Valitse kysymys muokataksesi</div>
          )}
        </Section>
      </div>
    </div>
  );
}
