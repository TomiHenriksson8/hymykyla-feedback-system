
export type Id = string;        // ObjectId as hex string
export type ISODate = string;   // ISO string

export type QuestionType = "scale5" | "boolean" | "text";
export type LocaleText = { fi: string; en: string; sv: string };

export type Question = {
  _id: Id;
  type: QuestionType;
  prompt: LocaleText;
  required?: boolean;
  order: number;
  min?: number;      // scale5
  max?: number;      // scale5
  maxLength?: number;// text
};

export type Survey = {
  _id: Id;
  title: string;
  version: number;
  isActive: boolean;
  questions: Question[];
  createdAt?: ISODate;
  updatedAt?: ISODate;
};
