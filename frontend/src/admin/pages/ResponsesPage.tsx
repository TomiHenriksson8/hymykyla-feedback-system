
import Card from '../components/Card';

function RowSkeleton() {
  return <div className="animate-pulse h-10 bg-appbg rounded-md" />;
}

export default function ResponsesPage() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Vastaukset</h2>
        <div className="text-sm text-ink-2">Suodattimet tulossa…</div>
      </div>
      <div className="space-y-2">
        <RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton />
      </div>
    </Card>
  );
}
