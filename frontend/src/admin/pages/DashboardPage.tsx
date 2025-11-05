// frontend/src/admin/pages/DashboardPage.tsx

import { useMemo } from 'react';
import Card from '../components/Card';
import { useResponses } from '../../features/responses/hooks';
import type { ResponseItem } from '../../features/responses/types';

// Helper functions to get today's date range
function getTodayRangeISO() {
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Start of today
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today
  return {
    todayStart: start.toISOString(),
    todayEnd: end.toISOString(),
  };
}

// Helper function to format time
function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Helper component for a single feedback item
function RecentFeedbackItem({ item }: { item: ResponseItem }) {
  // Try to find the first 'scale5' or 'boolean' answer to show as a summary
  const primaryAnswer =
    item.answers.find((a) => a.type === 'scale5')?.valueNumber ??
    item.answers.find((a) => a.type === 'boolean')?.valueBoolean;

  let summary = 'Avoin palaute'; // Default for text
  if (primaryAnswer != null) {
    summary = typeof primaryAnswer === 'boolean'
      ? (primaryAnswer ? 'Kyllä' : 'Ei')
      : `${primaryAnswer} / 5`;
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
      <div className="flex flex-col">
        <span className="font-medium text-ink">{summary}</span>
        <span className="text-sm text-ink-2">
          {item.answers.length} vastaus
        </span>
      </div>
      <span className="text-sm text-ink-2 font-medium">
        {formatTime(item.submittedAt)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  // Fetch responses only for today
  const { todayStart, todayEnd } = getTodayRangeISO();
  const { data: responseData, isLoading } = useResponses({
    from: todayStart,
    to: todayEnd,
    limit: 50, // Get up to 50 for the list
  });

  // Calculate stats from the fetched data
  const { totalToday, averageToday, recentItems } = useMemo(() => {
    const items = responseData?.items ?? [];
    if (items.length === 0) {
      return { totalToday: 0, averageToday: null, recentItems: [] };
    }

    // Get all 'scale5' answers
    const scaleAnswers = items
      .flatMap((item) => item.answers)
      .filter((answer) => answer.type === 'scale5' && answer.valueNumber != null);

    let avg: number | null = null;
    if (scaleAnswers.length > 0) {
      const sum = scaleAnswers.reduce((acc, ans) => acc + (ans.valueNumber ?? 0), 0);
      avg = sum / scaleAnswers.length;
    }

    // Get the 5 most recent items (they are already sorted by date)
    const recent = items.slice(0, 5);

    return {
      totalToday: items.length,
      averageToday: avg ? avg.toFixed(1) : null, // Format to 1 decimal place
      recentItems: recent,
    };
  }, [responseData]);

  // Helper to display the data or a loading/placeholder
  const stat = (value: string | number | null) => {
    if (isLoading) return '...';
    if (value === null) return '—';
    return value;
  };

  return (
    <div className="space-y-6 m-10">
      <div className="rounded-2xl bg-peach p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Yhteenveto</h1>
        <p className="mt-2 text-ink-2">Nopea näkymä tämän päivän tilanteeseen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm text-ink-2 mb-2">Päivän vastaukset</div>
          <div className="text-3xl font-semibold">{stat(totalToday)}</div>
        </Card>
        <Card>
          <div className="text-sm text-ink-2 mb-2">Keskiarvo (skala 1–5)</div>
          <div className="text-3xl font-semibold">{stat(averageToday)}</div>
        </Card>

        {/* THE CARD */}
        <Card className="md:col-span-2">
          <div className="font-semibold mb-2">Viimeisimmät palautteet</div>
          {isLoading && (
            <div className="text-ink-2 text-sm">Ladataan...</div>
          )}
          {!isLoading && recentItems.length === 0 && (
            <div className="text-ink-2 text-sm">Ei palautteita tältä päivältä.</div>
          )}
          {recentItems.length > 0 && (
            <div className="flex flex-col">
              {recentItems.map((item) => (
                <RecentFeedbackItem key={item._id} item={item} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}