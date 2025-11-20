import { useEffect, useMemo, useState } from "react";
import { useActiveSurvey } from "../../features/surveys/publicHooks";
import { useSubmitFeedback } from "../feedbackHooks";
import type { Question } from "../../features/surveys/types";
import { UI_TEXT, type Locale } from "../components/handleLaunguage.tsx";
import {
  ScaleQuestion,
  BooleanQuestion,
  QuestionText,
} from "../components/questionComponents";
import { AdminButton } from "../components/adminButton";

// Keep a local copy of the payload types so logic stays aligned with the backend contract
type AnswerPayload =
  | { questionId: string; type: "scale5"; valueNumber: number }
  | { questionId: string; type: "boolean"; valueBoolean: boolean }
  | { questionId: string; type: "text"; valueText: string };

type AnswersById = Record<string, unknown>;

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
        <AdminButton />
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
        <AdminButton />
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
        <AdminButton />
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
        <AdminButton />
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
      <AdminButton />
      <Card>
        <div className="flex items-center justify-between text-xs text-ink-3 mb-4">
          {/* Left side language buttons */}
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

          {/* Center step label */}
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
    <div className="w-full max-w-2xl md:max-w-3xl bg-white rounded-3xl shadow-xl px-4 py-6 md:px-10 md:py-10">
      {children}
    </div>
  );
}
