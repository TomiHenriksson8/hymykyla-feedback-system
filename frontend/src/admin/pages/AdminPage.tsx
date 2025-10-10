
import Card from '../components/Card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-peach p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">HyMy-kylä – Hallintapaneeli</h1>
        <p className="mt-2 text-ink-2">Yhteenveto palautteista ja kyselyistä.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><div className="text-sm text-ink-2 mb-2">Today</div><div className="text-3xl font-semibold text-ink">—</div></Card>
        <Card><div className="text-sm text-ink-2 mb-2">Avg. Satisfaction</div><div className="text-3xl font-semibold text-ink">—</div></Card>
        <Card className="md:col-span-2">
          <div className="font-semibold text-ink mb-2">Recent responses</div>
          <div className="text-ink-2 text-sm">Coming soon…</div>
        </Card>
      </div>
    </div>
  )
}
