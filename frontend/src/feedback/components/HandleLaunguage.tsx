import type { Question } from "../../features/surveys/types.ts";

// Locale is derived from Question prompt keys
export type Locale = keyof Question["prompt"];

export const UI_TEXT: Record<
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
    noSurveyBody: "Ingen aktiv enkät hittades. Försök igen om en stund.",
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
