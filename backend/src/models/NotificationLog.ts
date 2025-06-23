import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'orderStatus'
  | 'promotion'
  | 'newProduct'
  | 'all'
  | 'new_order';

export interface INotificationLog extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  sentAt: Date;
  sentTo: number;
}

const notificationLogSchema = new Schema<INotificationLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['orderStatus', 'promotion', 'newProduct', 'all', 'new_order'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: () => new Date() },
  sentTo: { type: Number, required: true },
});

export const NotificationLog = model<INotificationLog>(
  'NotificationLog',
  notificationLogSchema
);
