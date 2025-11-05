// frontend/src/admin/pages/AnalyticsPage.tsx

import { useMemo } from 'react';
import Card from '../components/Card';
import { useResponses } from '../../features/responses/hooks';
import type { Answer } from '../../features/responses/types';

// Helper component for a single text feedback item
function TextFeedbackItem({ answer }: { answer: Answer }) {
  if (answer.type !== 'text' || !answer.valueText) return null;
  return (
    <div className="border-b border-line last:border-b-0 py-3">
      <p className="text-ink">{answer.valueText}</p>
    </div>
  );
}

// Main page component
export default function AnalyticsPage() {
  // 1. Fetch ALL responses (no filters)
  const { data: responseData, isLoading } = useResponses();

  // 2. Process the data to calculate stats
  const { booleanStats, textResponses } = useMemo(() => {
    const items = responseData?.items ?? [];
    const allAnswers = items.flatMap((item) => item.answers);

    // Calculate boolean stats
    const booleans = allAnswers.filter(
      (a) : a is Answer & { type: 'boolean' } =>
        a.type === 'boolean' && a.valueBoolean != null
    );
    const yesCount = booleans.filter((a) => a.valueBoolean === true).length;
    const noCount = booleans.length - yesCount;

    // Filter for text responses
    const texts = allAnswers.filter(
      (a) : a is Answer & { type: 'text' } =>
        a.type === 'text' && a.valueText != null && a.valueText.trim() !== ''
    );

    return {
      booleanStats: { yes: yesCount, no: noCount, total: booleans.length },
      textResponses: texts,
    };
  }, [responseData]);

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

        {/* Placeholder for average scores */}
        <Card>
          <div className="font-semibold mb-2">Keskiarvot</div>
          <div className="text-ink-2 text-sm">Kaaviot tulossa…</div>
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