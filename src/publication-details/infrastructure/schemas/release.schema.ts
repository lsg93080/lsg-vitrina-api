import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ReleaseStatus } from '../../domain/value-objects/release.vo';

export type ReleaseDocument = HydratedDocument<ReleaseSchemaClass>;

@Schema({ collection: 'releases', timestamps: true })
export class ReleaseSchemaClass {
  @Prop({ required: true })
  repoId: string;

  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ default: '' })
  releaseNotes: string;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop({ type: String, default: null })
  downloadUrl: string | null;

  @Prop({
    required: true,
    enum: Object.values(ReleaseStatus),
    default: ReleaseStatus.PENDING,
  })
  status: ReleaseStatus;

  @Prop({ default: 0 })
  totalRating: number;

  @Prop({ default: 0 })
  totalReviews: number;
}

export const ReleaseSchema = SchemaFactory.createForClass(ReleaseSchemaClass);

ReleaseSchema.index({ repoId: 1 });
ReleaseSchema.index({ status: 1 });
ReleaseSchema.index({ releaseDate: -1 });
