

import mongoose, { Schema, model, Types, Model, HydratedDocument } from 'mongoose';

export type QuestionType = 'scale5' | 'boolean' | 'text';

export interface Question {
  _id: Types.ObjectId;
  type: QuestionType;
  prompt: { fi: string; en: string; sv: string };
  required?: boolean;
  order: number;
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface Survey {
  _id?: Types.ObjectId; // include _id so lean() types it
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
    prompt: {
      fi: { type: String, required: true },
      en: { type: String, required: true },
      sv: { type: String, required: true },
    },
    required: { type: Boolean, default: false },
    order: { type: Number, required: true },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    maxLength: { type: Number, default: 1000 },
  },
  { _id: false }
);

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

