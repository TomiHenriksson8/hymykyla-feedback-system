
import Card from '../components/Card';

export default function DashboardPage() {
  return (
    <div className="space-y-6 m-10">
      <div className="rounded-2xl bg-peach p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Yhteenveto</h1>
        <p className="mt-2 text-ink-2">Nopea näkymä tämän päivän tilanteeseen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><div className="text-sm text-ink-2 mb-2">Päivän vastaukset</div><div className="text-3xl font-semibold">—</div></Card>
        <Card><div className="text-sm text-ink-2 mb-2">Keskiarvo (skala 1–5)</div><div className="text-3xl font-semibold">—</div></Card>
        <Card className="md:col-span-2"><div className="font-semibold mb-2">Viimeisimmät palautteet</div><div className="text-ink-2 text-sm">—</div></Card>
      </div>
    </div>
  );
}
