/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import Card from "../components/Card";
import { useResponses } from "../../features/responses/hooks";
import type { Answer } from "../../features/responses/types";
import { useSurveys } from "../../features/surveys/hooks";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper component for a single text feedback item
function TextFeedbackItem({ answer }: { answer: Answer }) {
  if (answer.type !== "text" || !answer.valueText) return null;
  return (
    <div className="border-b border-line last:border-b-0 py-3">
      <p className="text-ink">{answer.valueText}</p>
    </div>
  );
}

type QuestionChart = {
  id: string;
  prompt: string;
  total: number;
  buckets: { name: string; value: number }[];
};

// Color palette for pie slices
const CHART_COLORS = [
  "#22c55e",
  "#4ade80",
  "#3b82f6",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#6366f1",
];

// Human friendly labels for scale answers
const SCALE_LABELS: Record<number, string> = {
  1: "1 Hyvä",
  2: "2 Melko hyvä",
  3: "3 Neutraali",
  4: "4 Melko huono",
  5: "5 Huono",
};

// Types only for CSV summarization
type CsvSummary = {
  questionId: string;
  prompt: string;
  lastDate: Date | null;
  type: "scale" | "boolean" | "mixed";
  sum: number;
  count: number;
  yesCount: number;
};

type ResponseItemForCsv = {
  submittedAt?: string | Date;
  createdAt?: string | Date;
  answers: Answer[];
};

// Escape CSV values and wrap in double quotes
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// Build user friendly CSV
function buildSummaryCsv(
  items: ResponseItemForCsv[],
  surveysData: any[] | undefined
): string {
  const questionPromptMap = new Map<string, any>();
  (surveysData ?? []).forEach((survey) => {
    survey.questions.forEach((q: any) => {
      questionPromptMap.set(String(q._id), q);
    });
  });

  const summaryMap = new Map<string, CsvSummary>();

  for (const item of items) {
    const dateRaw = item.submittedAt || item.createdAt || null;
    const date =
      dateRaw instanceof Date ? dateRaw : dateRaw ? new Date(dateRaw) : null;

    for (const answer of item.answers) {
      if (answer.type !== "scale5" && answer.type !== "boolean") continue;

      if (answer.type === "scale5" && answer.valueNumber == null) continue;
      if (answer.type === "boolean" && answer.valueBoolean == null) continue;

      const qid = String(answer.questionId);

      if (!summaryMap.has(qid)) {
        // Prefer snapshot from answer
        const snapshotPrompt =
          (answer as any).questionPrompt?.fi ||
          (answer as any).questionPrompt?.en ||
          (answer as any).questionPrompt?.sv;

        const q = questionPromptMap.get(qid);
        const promptFromSurvey =
          q?.prompt?.fi || q?.prompt?.en || q?.prompt?.sv || "";

        summaryMap.set(qid, {
          questionId: qid,
          prompt: snapshotPrompt || promptFromSurvey || "",
          lastDate: date,
          type: answer.type === "scale5" ? "scale" : "boolean",
          sum: 0,
          count: 0,
          yesCount: 0,
        });
      }

      const entry = summaryMap.get(qid)!;

      // Update last date
      if (date && (!entry.lastDate || date > entry.lastDate)) {
        entry.lastDate = date;
      }

      // Mark type as mixed if both appear
      if (
        (entry.type === "scale" && answer.type === "boolean") ||
        (entry.type === "boolean" && answer.type === "scale5")
      ) {
        entry.type = "mixed";
      }

      if (answer.type === "scale5") {
        const value = answer.valueNumber ?? 0;
        entry.sum += value;
        entry.count += 1;
      } else if (answer.type === "boolean") {
        const numeric = answer.valueBoolean ? 1 : 0;
        entry.sum += numeric;
        entry.count += 1;
        if (numeric === 1) {
          entry.yesCount += 1;
        }
      }
    }
  }

  const summaries = Array.from(summaryMap.values())
    .filter((s) => s.prompt && s.count > 0)
    .sort((a, b) => (b.lastDate?.getTime() || 0) - (a.lastDate?.getTime() || 0));

  const header = [
    "Kysymys",
    "Viimeisin vastaus",
    "Keskiarvo",
    "Vastausten määrä",
  ];

  const rows: string[] = [];
  rows.push(header.join(";"));

  for (const s of summaries) {
    const dateStr = s.lastDate
      ? s.lastDate.toLocaleDateString("fi-FI")
      : "";

    let avgLabel = "";

    if (s.type === "scale" || s.type === "mixed") {
      const avg = s.sum / s.count;
      const formatted = avg.toFixed(1).replace(".", ",");
      avgLabel = `${formatted} / 5`;
    } else if (s.type === "boolean") {
      const percent = s.count > 0 ? (s.yesCount / s.count) * 100 : 0;
      const formatted = Math.round(percent);
      avgLabel = `${formatted} % kyllä`;
    }

    const row = [
      csvEscape(s.prompt),
      csvEscape(dateStr),
      csvEscape(avgLabel),
      csvEscape(s.count),
    ];

    rows.push(row.join(";"));
  }

  return rows.join("\n");
}

export default function AnalyticsPage() {
  // Fetch all responses
  const { data: responseData, isLoading: isLoadingResponses } = useResponses();
  // Fetch all surveys to get question text
  const { data: surveysData, isLoading: isLoadingSurveys } = useSurveys();

  const isLoading = isLoadingResponses || isLoadingSurveys;
  const hasResponses = (responseData?.items?.length ?? 0) > 0;

  const { textResponses, questionCharts } = useMemo(() => {
    const items = responseData?.items ?? [];
    const allAnswers = items.flatMap((item) => item.answers);

    // Collect text responses
    const texts = allAnswers.filter(
      (a): a is Answer & { type: "text" } =>
        a.type === "text" &&
        a.valueText != null &&
        a.valueText.trim() !== ""
    );

    // Map question ids to prompts for charts
    const questionPromptMap = new Map<string, string>();
    (surveysData ?? []).forEach((survey) => {
      survey.questions.forEach((q) => {
        questionPromptMap.set(String(q._id), q.prompt.fi || q.prompt.en);
      });
    });

    // Group scale5 and boolean answers per question
    const grouped = new Map<
      string,
      { prompt: string; buckets: Map<string, number>; total: number }
    >();

    for (const answer of allAnswers) {
      if (answer.type !== "scale5" && answer.type !== "boolean") continue;

      if (answer.type === "scale5" && answer.valueNumber == null) continue;
      if (answer.type === "boolean" && answer.valueBoolean == null) continue;

      const qid = String(answer.questionId);

      const snapshotPrompt =
        (answer as any).questionPrompt?.fi ||
        (answer as any).questionPrompt?.en ||
        (answer as any).questionPrompt?.sv;

      if (!grouped.has(qid)) {
        grouped.set(qid, {
          prompt:
            snapshotPrompt ||
            questionPromptMap.get(qid) ||
            "",
          buckets: new Map<string, number>(),
          total: 0,
        });
      }

      const entry = grouped.get(qid)!;

      let bucketName: string;
      if (answer.type === "scale5") {
        const value = answer.valueNumber!;
        bucketName = SCALE_LABELS[value] ?? String(value);
      } else {
        bucketName = answer.valueBoolean ? "Kyllä" : "Ei";
      }

      entry.buckets.set(
        bucketName,
        (entry.buckets.get(bucketName) ?? 0) + 1
      );
      entry.total += 1;
    }

    const questionCharts: QuestionChart[] = [];

    grouped.forEach((entry, questionId) => {
      if (!entry.prompt) return;

      let bucketsArray = Array.from(entry.buckets.entries()).map(
        ([name, value]) => ({ name, value })
      );

      const allHaveLeadingNumber = bucketsArray.every(
        (b) => !Number.isNaN(parseInt(b.name, 10))
      );

      if (allHaveLeadingNumber) {
        bucketsArray = bucketsArray.sort(
          (a, b) => parseInt(a.name, 10) - parseInt(b.name, 10)
        );
      } else {
        const order = ["Kyllä", "Ei"];
        bucketsArray = bucketsArray.sort(
          (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
        );
      }

      questionCharts.push({
        id: questionId,
        prompt: entry.prompt,
        total: entry.total,
        buckets: bucketsArray,
      });
    });

    questionCharts.sort((a, b) => b.total - a.total);

    return {
      textResponses: texts,
      questionCharts,
    };
  }, [responseData, surveysData]);

  // Download user friendly CSV
  const handleDownloadCsv = () => {
    const items = responseData?.items as ResponseItemForCsv[] | undefined;
    if (!items || items.length === 0) return;

    const csv = buildSummaryCsv(items, surveysData as any[]);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    link.href = url;
    link.download = `palautteet-yhteenveto-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 m-10">
      <div className="rounded-2xl bg-peach p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Analytiikka
          </h1>
          <p className="mt-2 text-ink-2">
            Syvempi katsaus kerättyyn palautteeseen.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!hasResponses || isLoading}
            className={[
              "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border",
              !hasResponses || isLoading
                ? "bg-white text-ink-3 border-line cursor-not-allowed"
                : "bg-brand text-white border-brand hover:bg-brand-600",
            ].join(" ")}
          >
            Lataa yhteenveto CSV tiedostona
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Question based pie charts for scale5 and boolean answers */}
        <Card className="md:col-span-2">
          <div className="font-semibold mb-2">
            Kysymyskohtaiset jakaumat (asteikko ja kyllä ei vastaukset)
          </div>
          {questionCharts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {questionCharts.map((q) => (
                <div
                  key={q.id}
                  className="border border-line rounded-xl p-3 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <p
                      className="text-sm text-ink truncate"
                      title={q.prompt}
                    >
                      {q.prompt}
                    </p>
                    <div className="text-xs text-ink-3 flex-shrink-0">
                      {q.total} vastausta
                    </div>
                  </div>
                  <div className="w-full h-56">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={q.buckets}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          labelLine={false}
                        >
                          {q.buckets.map((entry, index) => {
                            const isBooleanChart = q.buckets.some(
                              (b) => b.name === "Kyllä" || b.name === "Ei"
                            );

                            let fill: string;
                            if (isBooleanChart) {
                              if (entry.name === "Kyllä") {
                                fill = "#22c55e";
                              } else if (entry.name === "Ei") {
                                fill = "#ef4444";
                              } else {
                                fill =
                                  CHART_COLORS[index % CHART_COLORS.length];
                              }
                            } else {
                              fill = CHART_COLORS[index % CHART_COLORS.length];
                            }

                            return (
                              <Cell
                                key={`question-${q.id}-${entry.name}`}
                                fill={fill}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              {isLoading
                ? "Ladataan..."
                : "Ei asteikko tai kyllä ei vastauksia."}
            </div>
          )}
        </Card>

        {/* Text feedback card */}
        <Card className="md:col-span-2">
          <div className="font-semibold mb-2">Avoin palaute</div>
          {textResponses.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2 divide-y divide-line">
              {textResponses.map((answer, index) => (
                <TextFeedbackItem
                  key={`${answer.questionId}-${index}`}
                  answer={answer}
                />
              ))}
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              {isLoading ? "Ladataan..." : "Ei avointa palautetta."}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
