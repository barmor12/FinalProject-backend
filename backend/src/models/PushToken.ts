import { Schema, model, Document, Types } from 'mongoose';

export interface IPushToken extends Document {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
}

const pushTokenSchema = new Schema<IPushToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const PushToken = model<IPushToken>('PushToken', pushTokenSchema);
