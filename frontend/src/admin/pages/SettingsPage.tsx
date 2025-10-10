
import Card from '../components/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="font-semibold mb-2">Tilin asetukset</div>
        <div className="text-ink-2 text-sm">Salasanan vaihto tulossa…</div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Sovelluksen asetukset</div>
        <div className="text-ink-2 text-sm">Kieliasetukset, PWA & iPad-kioski ohjeet tulossa…</div>
      </Card>
    </div>
  );
}
