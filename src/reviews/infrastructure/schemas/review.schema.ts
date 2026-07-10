import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<ReviewSchemaClass>;

@Schema({ collection: 'reviews', timestamps: true })
export class ReviewSchemaClass {
  @Prop({ required: true })
  repoId: string;

  @Prop({ required: true })
  releaseId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(ReviewSchemaClass);

ReviewSchema.index({ repoId: 1 });
ReviewSchema.index({ releaseId: 1 });
ReviewSchema.index({ authorId: 1 });
ReviewSchema.index({ repoId: 1, releaseId: 1 });
ReviewSchema.index({ authorId: 1, releaseId: 1 }, { unique: true });
