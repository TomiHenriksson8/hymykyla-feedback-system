// frontend/src/admin/pages/DashboardPage.tsx

import { useMemo } from 'react';
import Card from '../components/Card';
import { useResponses } from '../../features/responses/hooks'; // NEW: Import the hook

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

export default function DashboardPage() {
  // Fetch responses only for today
  const { todayStart, todayEnd } = getTodayRangeISO();
  const { data: responseData, isLoading } = useResponses({
    from: todayStart,
    to: todayEnd,
  });

  // Calculate stats from the fetched data
  const { totalToday, averageToday } = useMemo(() => {
    const items = responseData?.items ?? [];
    if (items.length === 0) {
      return { totalToday: 0, averageToday: null };
    }

    // Get all 'scale5' answers
    const scaleAnswers = items
      .flatMap((item) => item.answers)
      .filter((answer) => answer.type === 'scale5' && answer.valueNumber != null);

    if (scaleAnswers.length === 0) {
      return { totalToday: items.length, averageToday: null };
    }

    // Calculate the average
    const sum = scaleAnswers.reduce((acc, ans) => acc + (ans.valueNumber ?? 0), 0);
    const avg = sum / scaleAnswers.length;

    return {
      totalToday: items.length,
      averageToday: avg.toFixed(1), // Format to 1 decimal place
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
          {/* Display the real total */}
          <div className="text-3xl font-semibold">{stat(totalToday)}</div>
        </Card>
        <Card>
          <div className="text-sm text-ink-2 mb-2">Keskiarvo (skala 1–5)</div>
          {/* Display the real average */}
          <div className="text-3xl font-semibold">{stat(averageToday)}</div>
        </Card>
        <Card className="md:col-span-2">
          <div className="font-semibold mb-2">Viimeisimmät palautteet</div>
          {/* Will build this part later */}
          <div className="text-ink-2 text-sm">...tulossa pian</div>
        </Card>
      </div>
    </div>
  );
}