import mongoose, { Schema, model, Types, Model, HydratedDocument } from 'mongoose';

export interface Answer {
  questionId: Types.ObjectId;
  type: 'scale5' | 'boolean' | 'text';
  valueNumber?: number;
  valueBoolean?: boolean;
  valueText?: string;
}

export interface ResponseDoc {
  _id?: Types.ObjectId;
  surveyId: Types.ObjectId;
  surveyVersion: number;
  submittedAt?: Date;
  answers: Answer[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AnswerSchema = new Schema<Answer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['scale5', 'boolean', 'text'], required: true },
    valueNumber: { type: Number },
    valueBoolean: { type: Boolean },
    valueText: { type: String },
  },
  { _id: false }
);

const ResponseSchema = new Schema<ResponseDoc>(
  {
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
    surveyVersion: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    answers: { type: [AnswerSchema], validate: (v: Answer[]) => v.length > 0 },
  },
  { timestamps: true }
);

ResponseSchema.index({ surveyId: 1, surveyVersion: 1, submittedAt: -1 });

export type ResponseDocument = HydratedDocument<ResponseDoc>;

const ResponseModel: Model<ResponseDoc> =
  (mongoose.models.Response as Model<ResponseDoc>) || model<ResponseDoc>('Response', ResponseSchema);

export default ResponseModel;

