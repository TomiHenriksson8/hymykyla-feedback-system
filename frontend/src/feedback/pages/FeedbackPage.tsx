import { useEffect, useMemo, useState } from "react";
import { useActiveSurvey } from "../../features/surveys/publicHooks";
import { useSubmitFeedback } from "../feedbackHooks";
import type { Question } from "../../features/surveys/types";

// Keep a local copy of the payload types so logic stays aligned with the backend contract
type AnswerPayload =
  | { questionId: string; type: "scale5"; valueNumber: number }
  | { questionId: string; type: "boolean"; valueBoolean: boolean }
  | { questionId: string; type: "text"; valueText: string };

// Derive available locales from Question["prompt"]
type Locale = keyof Question["prompt"];

const UI_TEXT: Record<
  Locale,
  {
    noSurveyTitle: string;
    noSurveyBody: string;
    noQuestionsTitle: string;
    noQuestionsBody: string;
    thankYouTitle: string;
    thankYouBody: string;
    freeTextLabel: string;
    freeTextPlaceholder: string;
    requiredError: string;
    submitSending: string;
    submitLast: string;
    submitNext: string;
    submitError: string;
    booleanYes: string;
    booleanNo: string;
  }
> = {
  fi: {
    noSurveyTitle: "Palautetta ei voi antaa juuri nyt",
    noSurveyBody:
      "Aktiivista kyselyä ei löytynyt. Yritä hetken kuluttua uudestaan.",
    noQuestionsTitle: "Ei kysymyksiä",
    noQuestionsBody: "Tähän kyselyyn ei ole lisätty yhtään kysymystä.",
    thankYouTitle: "Kiitos palautteesta",
    thankYouBody: "Arvostamme aikaasi. Palautteesi auttaa meitä kehittymään.",
    freeTextLabel: "Vapaa palaute (valinnainen)",
    freeTextPlaceholder: "Kirjoita palautteesi tähän",
    requiredError: "Tämä kenttä on pakollinen.",
    submitSending: "Lähetetään",
    submitLast: "Lähetä",
    submitNext: "Seuraava",
    submitError: "Palautteen lähetys epäonnistui. Yritä uudestaan.",
    booleanYes: "Kyllä",
    booleanNo: "En",
  },
  en: {
    noSurveyTitle: "Feedback cannot be given right now",
    noSurveyBody: "No active survey was found. Please try again in a moment.",
    noQuestionsTitle: "No questions",
    noQuestionsBody: "There are no questions in this survey.",
    thankYouTitle: "Thank you for your feedback",
    thankYouBody: "We appreciate your time. Your feedback helps us improve.",
    freeTextLabel: "Open feedback (optional)",
    freeTextPlaceholder: "Write your feedback here",
    requiredError: "This field is required.",
    submitSending: "Sending",
    submitLast: "Submit",
    submitNext: "Next",
    submitError: "Sending feedback failed. Please try again.",
    booleanYes: "Yes",
    booleanNo: "No",
  },
  sv: {
    noSurveyTitle: "Det går inte att ge respons just nu",
    noSurveyBody:
      "Ingen aktiv enkät hittades. Försök igen om en stund.",
    noQuestionsTitle: "Inga frågor",
    noQuestionsBody: "Inga frågor har lagts till i den här enkäten.",
    thankYouTitle: "Tack för din respons",
    thankYouBody: "Vi uppskattar din tid. Din respons hjälper oss att bli bättre.",
    freeTextLabel: "Fritt svar (valfritt)",
    freeTextPlaceholder: "Skriv din respons här",
    requiredError: "Det här fältet är obligatoriskt.",
    submitSending: "Skickar",
    submitLast: "Skicka",
    submitNext: "Nästa",
    submitError: "Det gick inte att skicka responsen. Försök igen.",
    booleanYes: "Ja",
    booleanNo: "Nej",
  },
};

type AnswersById = Record<string, unknown>;

// Face images for scale questions.
const FACE_IMAGES: Record<number, string> = {
  1: "./assets/faces/good.png",
  2: "./assets/faces/okay.png",
  3: "./assets/faces/neutral.png",
  4: "./assets/faces/unhappy.png",
  5: "./assets/faces/bad.png",
};

// Seconds to show the thank you screen before restarting
const FEEDBACK_RESTART_SECONDS = 5;

export default function FeedbackPage() {
  const { data: survey, isLoading, isError } = useActiveSurvey();
  const {
    mutateAsync,
    isPending: isSubmitting,
    isSuccess,
    isError: isSubmitError,
    reset: resetSubmitState,
  } = useSubmitFeedback();

  const [answers, setAnswers] = useState<AnswersById>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textError, setTextError] = useState<string | null>(null);
  const [restartCountdown, setRestartCountdown] =
    useState(FEEDBACK_RESTART_SECONDS);
  const [locale, setLocale] = useState<Locale>("fi");

  const ui = UI_TEXT[locale];

  // Sort questions by order so that admin ordering is respected
  const questions = useMemo(() => {
    if (!survey) return [] as Question[];
    return [...survey.questions].sort((a, b) => a.order - b.order);
  }, [survey]);

  const currentQuestion = questions[currentIndex];

  // Reset questionnaire after successful submit
  useEffect(() => {
    if (!isSuccess) return;

    setRestartCountdown(FEEDBACK_RESTART_SECONDS);

    const interval = setInterval(() => {
      setRestartCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Start again with fresh state
          setAnswers({});
          setCurrentIndex(0);
          setTextError(null);
          resetSubmitState();
          return FEEDBACK_RESTART_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuccess, resetSubmitState]);

  // If we refetch a different survey, wipe local answers
  useEffect(() => {
    setAnswers({});
    setCurrentIndex(0);
    setTextError(null);
  }, [survey?._id]);

  async function finishAndSubmit(
    latestQuestionId?: string,
    latestValue?: unknown
  ) {
    if (!survey) return;
    const allAnswers: AnswersById = { ...answers };
    if (latestQuestionId) {
      allAnswers[latestQuestionId] = latestValue;
    }

    const payloadAnswers: AnswerPayload[] = questions
      .map<AnswerPayload | null>((q) => {
        const value = allAnswers[q._id];

        if (value === undefined || value === null || value === "") {
          if (q.required) {
            return null;
          }
          return null;
        }

        if (q.type === "scale5") {
          const num = typeof value === "number" ? value : Number(value);
          if (!Number.isFinite(num)) return null;
          return { questionId: q._id, type: "scale5", valueNumber: num };
        }

        if (q.type === "boolean") {
          let bool: boolean;
          if (typeof value === "boolean") {
            bool = value;
          } else if (typeof value === "string") {
            const v = value.toLowerCase();
            bool = v === "true" || v === "kylla" || v === "kyllä";
          } else {
            bool = Boolean(value);
          }
          return { questionId: q._id, type: "boolean", valueBoolean: bool };
        }

        if (q.type === "text") {
          return {
            questionId: q._id,
            type: "text",
            valueText: String(value),
          };
        }

        return null;
      })
      .filter((p): p is AnswerPayload => p !== null);

    await mutateAsync({
      surveyId: survey._id,
      answers: payloadAnswers,
    });
  }

  async function handleAnswerAndNext(question: Question, value: unknown) {
    setAnswers((prev) => ({ ...prev, [question._id]: value }));
    setTextError(null);

    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      await finishAndSubmit(question._id, value);
    } else {
      setCurrentIndex((idx) => idx + 1);
    }
  }

  function handleTextChange(question: Question, value: string) {
    setAnswers((prev) => ({ ...prev, [question._id]: value }));
    if (textError && value.trim().length > 0) {
      setTextError(null);
    }
  }

  async function handleTextNext(question: Question) {
    const value = (answers[question._id] ?? "") as string;
    const trimmed = value.trim();
    if (question.required && trimmed.length === 0) {
      setTextError(ui.requiredError);
      return;
    }
    await handleAnswerAndNext(question, trimmed);
  }

  // High level states

  if (isLoading) {
    return (
      <FullScreenShell>
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-peach-50 rounded-md w-32 mx-auto" />
            <div className="h-8 bg-peach-50 rounded-md w-3/4 mx-auto" />
            <div className="h-40 bg-peach-50 rounded-2xl mt-4" />
          </div>
        </Card>
      </FullScreenShell>
    );
  }

  if (isError || !survey) {
    return (
      <FullScreenShell>
        <Card>
          <h1 className="text-2xl font-semibold text-ink mb-4">
            {ui.noSurveyTitle}
          </h1>
          <p className="text-ink-2">{ui.noSurveyBody}</p>
        </Card>
      </FullScreenShell>
    );
  }

  if (questions.length === 0) {
    return (
      <FullScreenShell>
        <Card>
          <h1 className="text-2xl font-semibold text-ink mb-4">
            {ui.noQuestionsTitle}
          </h1>
          <p className="text-ink-2">{ui.noQuestionsBody}</p>
        </Card>
      </FullScreenShell>
    );
  }

  // Thank you screen, merged into the same page
  if (isSuccess) {
    const restartText =
      locale === "fi"
        ? `Uusi kysely alkaa automaattisesti ${restartCountdown} sekunnin kuluttua.`
        : locale === "en"
        ? `A new survey will start automatically in ${restartCountdown} seconds.`
        : `En ny enkät startar automatiskt om ${restartCountdown} sekunder.`;

    return (
      <FullScreenShell>
        <Card>
          <h1 className="text-3xl font-bold text-ink mb-4">
            {ui.thankYouTitle}
          </h1>
          <p className="text-lg text-ink-2 mb-4">{ui.thankYouBody}</p>
          <p className="text-sm text-ink-3">{restartText}</p>
        </Card>
      </FullScreenShell>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const stepLabel =
    locale === "fi"
      ? `Kysymys ${currentIndex + 1} / ${questions.length}`
      : locale === "en"
      ? `Question ${currentIndex + 1} / ${questions.length}`
      : `Fråga ${currentIndex + 1} / ${questions.length}`;

  const promptText =
    currentQuestion.prompt[locale] ?? currentQuestion.prompt.fi;

  const submitLabel = isSubmitting
    ? ui.submitSending
    : currentIndex === questions.length - 1
    ? ui.submitLast
    : ui.submitNext;

  return (
    <FullScreenShell>
      <Card>
        <div className="flex items-center justify-between text-xs text-ink-3 mb-4">
          <div className="flex gap-2">
            {(["fi", "en", "sv"] as Locale[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={[
                  "px-2 py-1 rounded-full border text-xs",
                  locale === lang
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-ink border-line",
                ].join(" ")}
              >
                {lang === "fi" && "Suomi"}
                {lang === "en" && "English"}
                {lang === "sv" && "Svenska"}
              </button>
            ))}
          </div>
          <div>{stepLabel}</div>
        </div>

        <h1 className="text-3xl md:text-4xl font-heading text-ink text-center mb-8">
          {promptText}
        </h1>

        {currentQuestion.type === "scale5" && (
          <ScaleQuestion
            question={currentQuestion}
            value={answers[currentQuestion._id] as number | undefined}
            onSelect={(val) => handleAnswerAndNext(currentQuestion, val)}
          />
        )}

        {currentQuestion.type === "boolean" && (
          <BooleanQuestion
            value={answers[currentQuestion._id] as boolean | undefined}
            onSelect={(val) => handleAnswerAndNext(currentQuestion, val)}
            yesLabel={ui.booleanYes}
            noLabel={ui.booleanNo}
          />
        )}

        {currentQuestion.type === "text" && (
          <div className="mt-2">
            <QuestionText
              value={(answers[currentQuestion._id] as string | undefined) ?? ""}
              onChange={(v) => handleTextChange(currentQuestion, v)}
              maxLength={currentQuestion.maxLength ?? 1000}
              label={ui.freeTextLabel}
              placeholder={ui.freeTextPlaceholder}
            />
            {textError && (
              <p className="mt-2 text-sm text-danger">{textError}</p>
            )}

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => handleTextNext(currentQuestion)}
                className="inline-flex px-8 py-3 rounded-full bg-brand text-white font-semibold text-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand"
                disabled={isSubmitting}
              >
                {submitLabel}
              </button>
            </div>

            {isSubmitError && (
              <p className="mt-3 text-sm text-danger">{ui.submitError}</p>
            )}
          </div>
        )}
      </Card>
    </FullScreenShell>
  );
}

// Layout helpers

function FullScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-50 to-peach flex items-center justify-center px-4 py-6">
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl px-6 py-8 md:px-10 md:py-10">
      {children}
    </div>
  );
}

// Question type components

type ScaleProps = {
  question: Question;
  value?: number;
  onSelect: (v: number) => void;
};

function ScaleQuestion({ question, value, onSelect }: ScaleProps) {
  const min = question.min ?? 1;
  const max = question.max ?? 5;
  const options = Array.from({ length: max - min + 1 }, (_, idx) => min + idx);

  return (
    <div className="flex items-center justify-between gap-3 md:gap-6 mt-4">
      {options.map((val) => {
        const selected = value === val;
        const src = FACE_IMAGES[val];
        return (
          <button
            key={val}
            type="button"
            onClick={() => onSelect(val)}
            className="flex-1 flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className={[
                "w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border border-line bg-peach-50 transition-transform",
                selected ? "ring-4 ring-brand shadow-lg scale-105" : "hover:scale-105",
              ].join(" ")}
            >
              {src ? (
                <img
                  src={src}
                  alt={`Arvosana ${val}`}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <span className="text-xl font-semibold text-ink">{val}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

type BooleanProps = {
  value?: boolean;
  onSelect: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

function BooleanQuestion({
  value,
  onSelect,
  yesLabel,
  noLabel,
}: BooleanProps) {
  return (
    <div className="flex justify-center gap-4 mt-4">
      <button
        type="button"
        onClick={() => onSelect(false)}
        className={[
          "px-6 py-3 rounded-full text-lg font-semibold border border-line bg-white",
          value === false
            ? "bg-brand text-white border-brand"
            : "hover:bg-peach-50",
        ].join(" ")}
      >
        {noLabel}
      </button>
      <button
        type="button"
        onClick={() => onSelect(true)}
        className={[
          "px-6 py-3 rounded-full text-lg font-semibold border border-line bg-white",
          value === true
            ? "bg-brand text-white border-brand"
            : "hover:bg-peach-50",
        ].join(" ")}
      >
        {yesLabel}
      </button>
    </div>
  );
}

type TextProps = {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  label: string;
  placeholder: string;
};

function QuestionText({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
}: TextProps) {
  return (
    <div>
      <p className="text-sm text-ink-3 mb-2">{label}</p>
      <textarea
        rows={4}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-brand bg-peach-50"
        placeholder={placeholder}
      />
      <div className="mt-1 text-right text-xs text-ink-3">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
