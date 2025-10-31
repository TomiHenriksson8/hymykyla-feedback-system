// frontend/src/feedback/pages/FeedbackPage.tsx

import { useMemo, useState } from 'react';
import { useActiveSurvey } from '../../features/surveys/publicHooks';

// This is the main page component
export default function FeedbackPage() {
  // 1. Fetch the active survey using our new hook
  const { data: survey, isLoading, isError } = useActiveSurvey();

  // 2. State to hold the user's answers.
  // We will store it in an object like: { questionId: answer, ... }
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // 3. A helper function to update the state when an answer changes
  const setAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // 4. Sort the questions by their 'order' field, just in case
  const questions = useMemo(() => {
    return survey?.questions.sort((a, b) => a.order - b.order) ?? [];
  }, [survey]);

  // --- Render logic ---

  // Handle loading state
  if (isLoading) {
    return <div className="min-h-screen grid place-items-center">Ladataan kyselyä...</div>;
  }

  // Handle error state
  if (isError || !survey) {
    return <div className="min-h-screen grid place-items-center">Kyselyä ei löytynyt.</div>;
  }

  // --- Main Content: Survey is loaded ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg">
        {/* Survey Title */}
        <h1 className="text-3xl font-bold text-ink mb-2">{survey.title}</h1>
        <p className="text-lg text-ink-2 mb-8">
          Kiitos, että annat palautetta!
        </p>

        {/* The Form */}
        <form className="space-y-10">
          {/* Loop over each question and render it */}
          {questions.map((question) => (
            <div key={question._id}>
              {/* Question Prompt */}
              <label className="block text-xl font-semibold text-ink mb-4">
                {question.prompt.fi}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {/* Render the correct input based on question type */}
              {question.type === 'scale5' && (
                <QuestionScale5
                  value={answers[question._id]}
                  onChange={(value) => setAnswer(question._id, value)}
                />
              )}

              {question.type === 'boolean' && (
                <QuestionBoolean
                  value={answers[question._id]}
                  onChange={(value) => setAnswer(question._id, value)}
                />
              )}

              {question.type === 'text' && (
                <QuestionText
                  value={answers[question._id]}
                  onChange={(value) => setAnswer(question._id, value)}
                />
              )}
            </div>
          ))}

          {/* Submit Button (we will make this work next) */}
          <div className="pt-6 border-t border-line">
            <button
              type="submit"
              className="w-full px-6 py-4 rounded-xl bg-brand text-white text-lg font-semibold hover:bg-brand-600"
            >
              Lähetä palaute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Re-usable Question Components ---

// Component for 'scale5' (1-5 buttons)
function QuestionScale5({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`
            w-12 h-12 rounded-full border-2 text-lg font-bold transition
            ${
              value === num
                ? 'bg-brand text-white border-brand-600'
                : 'bg-white text-ink border-line hover:bg-peach-50'
            }
          `}
        >
          {num}
        </button>
      ))}
    </div>
  );
}

// Component for 'boolean' (Yes/No buttons)
function QuestionBoolean({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`
          px-8 py-3 rounded-xl border-2 text-base font-semibold transition
          ${
            value === true
              ? 'bg-brand text-white border-brand-600'
              : 'bg-white text-ink border-line hover:bg-peach-50'
          }
        `}
      >
        Kyllä
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`
          px-8 py-3 rounded-xl border-2 text-base font-semibold transition
          ${
            value === false
              ? 'bg-brand text-white border-brand-600'
              : 'bg-white text-ink border-line hover:bg-peach-50'
          }
        `}
      >
        Ei
      </button>
    </div>
  );
}

// Component for 'text' (Text area)
function QuestionText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      rows={4}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-brand"
      placeholder="Kirjoita palautteesi tähän..."
    />
  );
}