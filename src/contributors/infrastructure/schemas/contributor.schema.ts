import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Platform } from '../../domain/value-objects/platform.enum';
import { SocialPlatform } from '../../domain/value-objects/social-platform.enum';

export type ContributorDocument = HydratedDocument<ContributorSchemaClass>;

@Schema({ _id: false, timestamps: true })
class ContrInfoSchema {
  @Prop({ default: '' }) username: string;
  @Prop({ default: '' }) imgUrl: string;
  @Prop({ default: '' }) bio: string;
  @Prop({ default: 0 }) postsQty: number;
  @Prop({ default: 0 }) videogamesQty: number;
  @Prop({ default: 0 }) extensionsQty: number;
  @Prop({ type: Date, default: null }) lastPost: Date | null;
  @Prop({ default: 0 }) totalComments: number;
  @Prop({ default: 0 }) totalRating: number;
  @Prop({ default: 0 }) downloads: number;

  // Social links keyed by SocialPlatform enum values, stored as a plain object; absent keys are omitted (not stored as empty strings).
  @Prop({
    type: Object,
    default: {},
    validate: {
      validator: (v: Record<string, unknown>) =>
        Object.keys(v).every((k) =>
          (Object.values(SocialPlatform) as string[]).includes(k),
        ),
      message: 'socials contains an invalid SocialPlatform key',
    },
  })
  socials: Partial<Record<SocialPlatform, string>>;
}

@Schema({ collection: 'contributors', timestamps: true })
export class ContributorSchemaClass {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  isReviewer: boolean;

  @Prop({ type: [String], enum: Object.values(Platform), default: [] })
  platforms: Platform[];

  @Prop({ type: ContrInfoSchema, default: () => ({}) })
  contrInfo: ContrInfoSchema;
}

export const ContributorSchema = SchemaFactory.createForClass(
  ContributorSchemaClass,
);

ContributorSchema.index({ 'contrInfo.username': 'text' });
ContributorSchema.index({ 'contrInfo.postsQty': -1 });
ContributorSchema.index({ isReviewer: 1 });
