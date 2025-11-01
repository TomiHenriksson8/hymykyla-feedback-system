// frontend/src/feedback/pages/ThankYouPage.tsx

import { Link } from 'react-router-dom';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 grid place-items-center">
      <div className="max-w-xl text-center bg-white p-6 md:p-10 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-ink mb-4">
          Kiitos palautteesta!
        </h1>
        <p className="text-lg text-ink-2 mb-8">
          Arvostamme aikaasi. Palautteesi auttaa meitä kehittymään.
        </p>
        <Link
          to="/palaute"
          replace={true}
          className="inline-block px-6 py-3 rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-600"
        >
          Anna uusi palaute
        </Link>
      </div>
    </div>
  );
}