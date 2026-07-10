import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PublicationDetailsDocument =
  HydratedDocument<PublicationDetailsSchemaClass>;

@Schema({ collection: 'publication_details', timestamps: true })
export class PublicationDetailsSchemaClass {
  @Prop({ required: true, unique: true })
  repoId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  longDescription: string;

  @Prop({ required: true })
  repoUrl: string;

  @Prop({ default: '' })
  license: string;

  @Prop({ required: true })
  defaultBranch: string;

  @Prop({ default: '' })
  repoDoc: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  reviewers: string[];
}

export const PublicationDetailsSchema = SchemaFactory.createForClass(
  PublicationDetailsSchemaClass,
);

PublicationDetailsSchema.index({ authorId: 1 });
