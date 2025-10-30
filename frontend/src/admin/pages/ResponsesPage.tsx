// src/admin/routes/ResponsesPage.tsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResponses } from "../../features/responses/hooks";
import { useSurvey, useSurveys } from "../../features/surveys/hooks";

/* ---------------- date helpers ---------------- */

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function fmtDateTimeFI(d?: string | Date) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fi-FI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}
function fmtAnswerValue(a: {
  type: "scale5" | "boolean" | "text";
  valueNumber?: number;
  valueBoolean?: boolean;
  valueText?: string;
}) {
  if (a.type === "scale5") return (a.valueNumber ?? "—") + "/5";
  if (a.type === "boolean") return a.valueBoolean === true ? "Kyllä" : a.valueBoolean === false ? "Ei" : "—";
  return a.valueText?.trim() || "—";
}
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- tiny UI ---------------- */

function RowSkeleton() {
  return <div className="animate-pulse h-12 bg-appbg rounded-lg" />;
}

function CopyInput({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(value);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1200);
  }, [value]);

  return (
    <div className="grid grid-cols-[180px_1fr_auto] items-center gap-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={onCopy}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {copied ? "Kopioitu ✓" : "Kopioi"}
      </button>
    </div>
  );
}

/* ---------------- centered date range pill ---------------- */

type PresetKey = "today" | "week" | "month" | "none";

function DateRangeBar({
  fromStr,
  toStr,
  setFromStr,
  setToStr,
}: {
  fromStr: string;
  toStr: string;
  setFromStr: (v: string) => void;
  setToStr: (v: string) => void;
}) {
  const setToday = () => {
    const d = toYMD(new Date());
    setFromStr(d);
    setToStr(d);
  };
  const setLast7 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setFromStr(toYMD(start));
    setToStr(toYMD(end));
  };
  const setLast30 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    setFromStr(toYMD(start));
    setToStr(toYMD(end));
  };
  const clearDates = () => {
    setFromStr("");
    setToStr("");
  };

  const active: PresetKey = useMemo(() => {
    if (!fromStr || !toStr) return "none";
    const f = new Date(fromStr + "T00:00:00");
    const t = new Date(toStr + "T00:00:00");
    const todayStr = toYMD(new Date());
    if (fromStr === todayStr && toStr === todayStr) return "today";
    const end = new Date();
    const wStart = new Date(); wStart.setDate(end.getDate() - 6);
    if (toYMD(f) === toYMD(wStart) && toYMD(t) === toYMD(end)) return "week";
    const mStart = new Date(); mStart.setDate(mStart.getDate() - 29);
    if (toYMD(f) === toYMD(mStart) && toYMD(t) === toYMD(end)) return "month";
    return "none";
  }, [fromStr, toStr]);

  return (
    <div className="justify-self-center">
      <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/90 px-2 py-2.5 shadow-sm backdrop-blur">
        <div className="inline-flex items-center gap-2 pl-1">
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            placeholder="Alkaen"
            className="h-10 w-[10rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-zinc-300">—</span>
          <input
            type="date"
            value={toStr}
            onChange={(e) => setToStr(e.target.value)}
            placeholder="Päättyen"
            className="h-10 w-[10rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mx-1 h-6 w-px bg-zinc-200" />
        <div className="inline-flex items-center rounded-lg bg-zinc-100 p-0.5">
          <button
            onClick={setToday}
            className={`h-9 px-3 text-sm rounded-lg transition ${active === "today" ? "bg-white shadow-sm border border-zinc-200" : "hover:bg-white/60"}`}
          >
            Tänään
          </button>
          <button
            onClick={setLast7}
            className={`h-9 px-3 text-sm rounded-lg transition ${active === "week" ? "bg-white shadow-sm border border-zinc-200" : "hover:bg-white/60"}`}
          >
            Viikko
          </button>
          <button
            onClick={setLast30}
            className={`h-9 px-3 text-sm rounded-lg transition ${active === "month" ? "bg-white shadow-sm border border-zinc-200" : "hover:bg-white/60"}`}
          >
            30 pv
          </button>
          <button onClick={clearDates} className="h-9 px-3 text-sm rounded-lg hover:bg-white/60">
            Tyhjennä
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- survey filter sidebar ---------------- */

function SurveyFilter({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const surveysQ = useSurveys();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const arr = surveysQ.data ?? [];
    if (!q.trim()) return arr;
    const s = q.toLowerCase();
    return arr.filter((x) => x.title.toLowerCase().includes(s));
  }, [surveysQ.data, q]);

  // Auto-select first survey if none selected and data exists
  useEffect(() => {
    if (!selectedId && items.length > 0) {
      onSelect(items[0]._id);
    }
  }, [selectedId, items, onSelect]);

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm self-start sticky top-4">
      <div className="px-1 pb-2">
        <div className="text-sm font-medium text-zinc-900">Kyselyt</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hae otsikolla…"
          className="mt-2 w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mt-1 max-h-[calc(100vh-220px)] overflow-auto pr-1 space-y-1">
        {surveysQ.isLoading && <div className="px-3 py-2 text-sm text-zinc-500">Ladataan…</div>}
        {surveysQ.isError && <div className="px-3 py-2 text-sm text-amber-600">Virhe ladattaessa</div>}

        {items.map((s) => (
          <button
            key={s._id}
            onClick={() => onSelect(s._id)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${
              selectedId === s._id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-zinc-50"
            }`}
            title={`v${s.version}${s.isActive ? " · aktiivinen" : ""}`}
          >
            <div className="truncate text-zinc-900">{s.title}</div>
            <div className="text-[11px] text-zinc-500">v{s.version}{s.isActive ? " · aktiivinen" : ""}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}


function ResponseRow({ r }: { r: any }) {
  const sQ = useSurvey(String(r.surveyId || ""));

  const questions = useMemo(() => {
    const qs = (sQ.data?.questions ?? []).slice();
    qs.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    return qs;
  }, [sQ.data]);

  function qLabelFor(a: any, idx: number) {
    if (a.questionId && questions.length) {
      const q = questions.find((qq: any) => String(qq._id) === String(a.questionId));
      if (q) {
        const p = typeof q.prompt === "string" ? q.prompt : (q.prompt?.fi || q.prompt?.en || q.prompt?.sv);
        if (p) return p;
      }
    }
    const byIdx = questions[idx];
    if (byIdx) {
      const p = typeof byIdx.prompt === "string" ? byIdx.prompt : (byIdx.prompt?.fi || byIdx.prompt?.en || byIdx.prompt?.sv);
      if (p) return p;
    }
    return `Kysymys ${idx + 1}`;
  }

  const rows = r.answers.map((a: any, idx: number) => ({
    label: qLabelFor(a, idx),
    value: fmtAnswerValue(a),
  }));

  const allText = [
    `Aika: ${fmtDateTimeFI(r.submittedAt)}`,
    `Kysely: ${sQ.data?.title ?? "—"}`,
    `Versio: ${r.surveyVersion}`,
    ...rows.map(({ label, value }) => `${label}: ${value}`),
  ].join("\n");

  const [open, setOpen] = useState(false);
  const panelId = `resp-panel-${String(r._id)}`;

  // tiny helper to stop header toggle when interacting inside the panel
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="px-2 sm:px-4 py-2">
      <div className="group w-full rounded-2xl border border-zinc-200 bg-white px-5 py-5 text-left shadow-sm hover:shadow-md transition">
        {/* HEADER is the only interactive toggle */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
        >
          <div className="min-w-0 text-left">
            <div className="text-sm text-zinc-500">{fmtDateTimeFI(r.submittedAt)}</div>
            <div className="mt-0.5 text-[17px] font-semibold text-zinc-900 truncate">
              {sQ.data?.title || "—"}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Versio {r.surveyVersion}</div>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 group-hover:bg-zinc-100">
            {open ? "Sulje" : "Avaa"}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
              onClick={stop}
              onMouseDown={stop}
            >
              <div className="mt-4 rounded-xl bg-zinc-50/70 p-4 border border-zinc-200">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await copyToClipboard(allText);
                      if (!ok) alert("Kopiointi epäonnistui");
                    }}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Kopioi kaikki
                  </button>
                </div>

                <div className="space-y-3">
                  <div onClick={stop} onMouseDown={stop}>
                    <CopyInput label="Aika" value={fmtDateTimeFI(r.submittedAt)} />
                  </div>
                  <div onClick={stop} onMouseDown={stop}>
                    <CopyInput label="Kysely" value={sQ.data?.title || "—"} />
                  </div>
                  <div onClick={stop} onMouseDown={stop}>
                    <CopyInput label="Versio" value={String(r.surveyVersion)} />
                  </div>

                  {rows.map((rv, idx) => (
                    <div key={`copy-${idx}`} onClick={stop} onMouseDown={stop}>
                      <CopyInput label={rv.label || `Kysymys ${idx + 1}`} value={rv.value} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


/* ---------------- page ---------------- */

export default function ResponsesPage() {
  const [fromStr, setFromStr] = useState<string>("");
  const [toStr, setToStr] = useState<string>("");
  const [surveyId, setSurveyId] = useState<string | undefined>(undefined);

  // hook params
  const params = useMemo(() => {
    const dateFrom = fromStr ? startOfDayLocal(new Date(fromStr)).toISOString() : undefined;
    const dateTo = toStr ? endOfDayLocal(new Date(toStr)).toISOString() : undefined;
    return { limit: 50, dateFrom, dateTo, surveyId } as const;
  }, [fromStr, toStr, surveyId]);

  const q = useResponses(params);
  const items = q.data?.items ?? [];

  return (
    <div>
      {/* Top bar: 3-col grid with centered date filter */}
      <div className="border-b border-line/70 w-full pb-3">
        <div className="px-6 md:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
          <h1 className="justify-self-start text-2xl font-heading font-semibold text-black">
            Vastaukset
          </h1>
          <DateRangeBar fromStr={fromStr} toStr={toStr} setFromStr={setFromStr} setToStr={setToStr} />
          <div className="justify-self-end" />
        </div>
      </div>

      {/* Layout: wider sidebar + list (sidebar doesn't stretch) */}
      <div className="my-5 mx-6 md:mx-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* Sidebar (no "Kaikki kyselyt") */}
        <SurveyFilter selectedId={surveyId} onSelect={(id) => setSurveyId(id)} />

        {/* List */}
        <div className="min-h-[200px]">
          {q.isLoading && (
            <div className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          )}

          {q.isError && (
            <div className="text-sm text-amber-600">Virhe ladattaessa. Yritä hetken päästä uudelleen.</div>
          )}

          {!q.isLoading && !q.isError && items.length === 0 && (
            <div className="text-sm text-zinc-500">Ei vastauksia valituilla suodattimilla.</div>
          )}

          {!q.isLoading && !q.isError && items.length > 0 && (
            <div className="space-y-3">
              {items.map((r: any) => (
                <ResponseRow key={String(r._id)} r={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
