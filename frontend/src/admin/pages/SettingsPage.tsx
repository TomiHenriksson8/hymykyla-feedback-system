// frontend/src/admin/pages/SettingsPage.tsx

import { useState } from 'react';
import Card from '../components/Card';
import { postJSON } from '../../lib/api'; 

export default function SettingsPage() {
  // State for the form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Client-side validation
    if (!currentPassword || !newPassword) {
      setError('Täytä kaikki kentät.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Uudet salasanat eivät täsmää.');
      return;
    }

    // 2. Call the backend
    setIsLoading(true);
    try {
      await postJSON('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      // 3. Handle success
      setSuccess('Salasana vaihdettu onnistuneesti!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      // 4. Handle errors
      if (err.status === 401) {
        setError('Nykyinen salasana on väärä.');
      } else {
        setError('Salasanan vaihtaminen epäonnistui. Yritä uudelleen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper component for form inputs
  const FormInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (s: string) => void;
  }) => (
    <label className="block">
      <span className="text-sm text-ink-2">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full max-w-sm border border-line rounded-xl px-3 py-2"
      />
    </label>
  );

  return (
    <div className="space-y-6 m-10">
      <div className="rounded-2xl bg-peach p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Asetukset</h1>
        <p className="mt-2 text-ink-2">Vaihda salasanasi.</p>
      </div>

      <Card className="max-w-2xl">
        <div className="font-semibold mb-4 text-lg">Vaihda salasana</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nykyinen salasana"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <FormInput
            label="Uusi salasana"
            value={newPassword}
            onChange={setNewPassword}
          />
          <FormInput
            label="Vahvista uusi salasana"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          {/* --- Messages --- */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="
                mt-2 px-5 py-2 rounded-xl bg-brand text-white font-semibold 
                hover:bg-brand-600 transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? 'Tallennetaan...' : 'Vaihda salasana'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}