
import Card from '../components/Card';

export default function AnalyticsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card><div className="font-semibold mb-2">Keskiarvot</div><div className="text-ink-2 text-sm">Kaaviot tulossa…</div></Card>
      <Card><div className="font-semibold mb-2">Kyllä / Ei -jakaumat</div><div className="text-ink-2 text-sm">Kaaviot tulossa…</div></Card>
      <Card className="md:col-span-2"><div className="font-semibold mb-2">Aikasarja</div><div className="text-ink-2 text-sm">Kaavio tulossa…</div></Card>
    </div>
  );
}
