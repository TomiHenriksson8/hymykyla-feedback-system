// frontend/src/admin/pages/AnalyticsPage.tsx

import { useMemo } from 'react';
import Card from '../components/Card';
import { useResponses } from '../../features/responses/hooks';
import type { Answer } from '../../features/responses/types';
import { useSurveys } from '../../features/surveys/hooks'; 

// Helper component for a single text feedback item
function TextFeedbackItem({ answer }: { answer: Answer }) {
  if (answer.type !== 'text' || !answer.valueText) return null;
  return (
    <div className="border-b border-line last:border-b-0 py-3">
      <p className="text-ink">{answer.valueText}</p>
    </div>
  );
}

// Helper component for a single average score item
function AverageScoreItem({
  prompt,
  average,
  count,
}: {
  prompt: string;
  average: number;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-ink truncate" title={prompt}>
          {prompt}
        </p>
        <span className="text-sm text-ink-2">{count} vastaus</span>
      </div>
      <div className="text-2xl font-semibold text-brand pl-4">
        {average.toFixed(1)}
      </div>
    </div>
  );
}

// Main page component
export default function AnalyticsPage() {
  // 1. Fetch ALL responses
  const { data: responseData, isLoading: isLoadingResponses } = useResponses();
  // Fetch all surveys to get question text
  const { data: surveysData, isLoading: isLoadingSurveys } = useSurveys();

  const isLoading = isLoadingResponses || isLoadingSurveys;

  // 2. Process the data to calculate stats
  const { booleanStats, textResponses, scaleAverages } = useMemo(() => {
    const items = responseData?.items ?? [];
    const allAnswers = items.flatMap((item) => item.answers);

    // --- Boolean Stats ---
    const booleans = allAnswers.filter(
      (a) : a is Answer & { type: 'boolean' } =>
        a.type === 'boolean' && a.valueBoolean != null
    );
    const yesCount = booleans.filter((a) => a.valueBoolean === true).length;
    const noCount = booleans.length - yesCount;

    // --- Text Responses ---
    const texts = allAnswers.filter(
      (a) : a is Answer & { type: 'text' } =>
        a.type === 'text' && a.valueText != null && a.valueText.trim() !== ''
    );

    // --- Scale Averages ---
    const scaleAnswers = allAnswers.filter(
      (a) : a is Answer & { type: 'scale5' } =>
        a.type === 'scale5' && a.valueNumber != null
    );

    // Create a map of all questions { questionId: "Question text" }
    const questionPromptMap = new Map<string, string>();
    (surveysData ?? []).forEach((survey) => {
      survey.questions.forEach((q) => {
        questionPromptMap.set(q._id, q.prompt.fi || q.prompt.en);
      });
    });

    // Group answers by questionId: { questionId: [5, 4, 5, ...] }
    const answersByQuestion = new Map<string, number[]>();
    for (const answer of scaleAnswers) {
      if (!answersByQuestion.has(answer.questionId)) {
        answersByQuestion.set(answer.questionId, []);
      }
      answersByQuestion.get(answer.questionId)!.push(answer.valueNumber!);
    }

    // Calculate average for each group
    const averages: {
      id: string;
      prompt: string;
      average: number;
      count: number;
    }[] = [];

    answersByQuestion.forEach((values, questionId) => {
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = sum / values.length;
      averages.push({
        id: questionId,
        prompt: questionPromptMap.get(questionId) || 'Tuntematon kysymys',
        average: avg,
        count: values.length,
      });
    });

    return {
      booleanStats: { yes: yesCount, no: noCount, total: booleans.length },
      textResponses: texts,
      scaleAverages: averages.sort((a, b) => b.average - a.average), // Sort highest avg first
    };
  }, [responseData, surveysData]);

  // Helper to display loading state
  const statDisplay = (value: any) => (isLoading ? '...' : value);

  return (
    <div className="space-y-6 m-10">
      <div className="rounded-2xl bg-peach p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Analytiikka</h1>
        <p className="mt-2 text-ink-2">Syvempi katsaus kerättyyn palautteeseen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Boolean Stats Card */}
        <Card>
          <div className="font-semibold mb-3">Kyllä / Ei -jakaumat</div>
          {booleanStats.total > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-green-700">Kyllä</span>
                <span className="text-2xl font-semibold">
                  {statDisplay(booleanStats.yes)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-red-700">Ei</span>
                <span className="text-2xl font-semibold">
                  {statDisplay(booleanStats.no)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="text-sm font-medium text-ink-2">Yhteensä</span>
                <span className="text-lg font-semibold">
                  {statDisplay(booleanStats.total)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              {isLoading ? 'Ladataan...' : 'Ei Kyllä/Ei vastauksia.'}
            </div>
          )}
        </Card>

        {/* --- THE CARD --- */}
        <Card>
          <div className="font-semibold mb-2">Keskiarvot (1-5)</div>
          {scaleAverages.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {scaleAverages.map((item) => (
                <AverageScoreItem
                  key={item.id}
                  prompt={item.prompt}
                  average={item.average}
                  count={item.count}
                />
              ))}
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              {isLoading ? 'Ladataan...' : 'Ei asteikkovastauksia.'}
            </div>
          )}
        </Card>

        {/* Text Feedback Card */}
        <Card className="md:col-span-2">
          <div className="font-semibold mb-2">Avoin palaute</div>
          {textResponses.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2 divide-y divide-line">
              {textResponses.map((answer, index) => (
                <TextFeedbackItem key={`${answer.questionId}-${index}`} answer={answer} />
              ))}
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              {isLoading ? 'Ladataan...' : 'Ei avointa palautetta.'}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}