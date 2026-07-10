import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Platform } from '@/contributors/domain/value-objects/platform.enum';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
  VcsProvider,
} from '../../domain/value-objects/publication.vo';

export type PublicationDocument = HydratedDocument<PublicationSchemaClass>;

export type ReportsHistoryAction = 'warn' | 'suspend' | 'reactivate' | 'reply';

export interface ReportsHistoryEntry {
  _id?: Types.ObjectId;
  action: ReportsHistoryAction;
  message: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

@Schema({ collection: 'publications', timestamps: true })
export class PublicationSchemaClass {
  @Prop({ required: true, unique: true })
  repoId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true, enum: Object.values(PubType) })
  type: PubType;

  @Prop({ required: true, enum: Object.values(EsrbRating) })
  esrbRating: EsrbRating;

  @Prop({ type: [String], enum: Object.values(Platform), default: [] })
  platforms: Platform[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  releaseYear: number;

  @Prop({
    required: true,
    enum: Object.values(PublicationStatus),
    default: PublicationStatus.DRAFT,
  })
  status: PublicationStatus;

  @Prop({ default: 0 })
  totalRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  downloads: number;

  @Prop({ type: String, default: null })
  thumbnailUrl: string | null;

  @Prop({ type: String, default: null })
  repoDetailsId: string | null;

  @Prop({ type: String, enum: Object.values(VcsProvider), default: null })
  vcsProvider: VcsProvider | null;

  @Prop({
    type: [
      {
        action: {
          type: String,
          enum: ['warn', 'suspend', 'reactivate', 'reply'],
          required: true,
        },
        message: { type: String, required: true },
        authorId: { type: String, required: true },
        authorName: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  reportsHistory: ReportsHistoryEntry[];
}

export const PublicationSchema = SchemaFactory.createForClass(
  PublicationSchemaClass,
);

PublicationSchema.index({ status: 1 });
PublicationSchema.index({ type: 1 });
PublicationSchema.index({ esrbRating: 1 });
PublicationSchema.index({ platforms: 1 });
PublicationSchema.index({ tags: 1 });
PublicationSchema.index({ releaseYear: 1 });
PublicationSchema.index({ authorId: 1 });
PublicationSchema.index({ authorId: 1, vcsProvider: 1 });
PublicationSchema.index({ totalRating: -1 });
PublicationSchema.index({ downloads: -1 });
PublicationSchema.index({ totalReviews: -1 });
