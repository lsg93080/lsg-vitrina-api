import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewerAssignmentDocument =
  HydratedDocument<ReviewerAssignmentSchemaClass>;

@Schema({ collection: 'reviewer_assignments', timestamps: false })
export class ReviewerAssignmentSchemaClass {
  @Prop({ required: true })
  publicationRepoId: string;

  @Prop({ required: true })
  reviewerId: string;

  @Prop({ required: true })
  reviewerEmail: string;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ type: Object, default: null })
  verdict: { isSafe: boolean; comment: string | null } | null;

  @Prop({ required: true })
  assignedAt: Date;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;
}

export const ReviewerAssignmentSchema = SchemaFactory.createForClass(
  ReviewerAssignmentSchemaClass,
);

ReviewerAssignmentSchema.index({ reviewerId: 1, status: 1 });
ReviewerAssignmentSchema.index({ publicationRepoId: 1 });
ReviewerAssignmentSchema.index({ reviewerId: 1 });
