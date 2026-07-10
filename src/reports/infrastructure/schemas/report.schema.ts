import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ReportReason,
  ReportStatus,
} from '../../domain/value-objects/report-reason.vo';

export type ReportDocument = HydratedDocument<ReportSchemaClass>;

@Schema({ collection: 'reports', timestamps: true })
export class ReportSchemaClass {
  @Prop({ required: true })
  publicationId: string;

  @Prop({ required: true })
  reporterId: string;

  @Prop({ required: true, enum: Object.values(ReportReason) })
  reason: ReportReason;

  @Prop({ default: '' })
  description: string;

  @Prop({
    required: true,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Prop({ type: String, default: null })
  resolvedBy: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;
}

export const ReportSchema = SchemaFactory.createForClass(ReportSchemaClass);

ReportSchema.index({ publicationId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ reporterId: 1 });
