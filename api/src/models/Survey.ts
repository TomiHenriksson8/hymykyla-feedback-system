import mongoose, { Schema, model, Types, Model, HydratedDocument } from 'mongoose';

export type QuestionType = 'scale5' | 'boolean' | 'text';

export interface Question {
  _id: Types.ObjectId;
  type: QuestionType;
  prompt: { fi: string | null; en: string | null; sv: string | null };
  required?: boolean;
  order: number;
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface Survey {
  _id?: Types.ObjectId;
  title: string;
  version: number;
  isActive: boolean;
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
}

const QuestionSchema = new Schema<Question>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    type: { type: String, enum: ['scale5', 'boolean', 'text'], required: true },

    // Make locales optional + default to null
    prompt: {
      fi: { type: String, required: false, default: null },
      en: { type: String, required: false, default: null },
      sv: { type: String, required: false, default: null },
    },

    required: { type: Boolean, default: false },
    order: { type: Number, required: true },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    maxLength: { type: Number, default: 1000 },
  },
  { _id: false }
);

// Ensure at least one locale is present (non-empty string after trim)
QuestionSchema.pre('validate', function (next) {
  const p = (this as any).prompt || {};
  const has =
    (typeof p.fi === 'string' && p.fi.trim().length > 0) ||
    (typeof p.en === 'string' && p.en.trim().length > 0) ||
    (typeof p.sv === 'string' && p.sv.trim().length > 0);

  if (has) return next();
  return next(
    new mongoose.Error.ValidatorError({
      path: 'prompt',
      message: 'At least one of prompt.fi/en/sv is required',
    })
  );
});

const SurveySchema = new Schema<Survey>(
  {
    title: { type: String, required: true },
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    questions: { type: [QuestionSchema], validate: (v: Question[]) => v.length > 0 },
  },
  { timestamps: true }
);

SurveySchema.index({ isActive: 1, version: -1 });

export type SurveyDocument = HydratedDocument<Survey>;

const SurveyModel: Model<Survey> =
  (mongoose.models.Survey as Model<Survey>) || model<Survey>('Survey', SurveySchema);

export default SurveyModel;
