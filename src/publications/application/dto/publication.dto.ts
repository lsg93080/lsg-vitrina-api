import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Platform } from '@/contributors/domain/value-objects/platform.enum';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
  VcsProvider,
} from '../../domain/value-objects/publication.vo';
import { Publication } from '../../domain/entities/publication.entity';
import type { PublicationDetails } from '@/publication-details/domain/entities/publication-details.entity';
import {
  type PublicationDetailsResponseDto,
  toPublicationDetailsResponse,
} from '@/publication-details/application/dto/publication-details.dto';

function toArray({ value }: { value: unknown }): unknown[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value as unknown[];
  return [value];
}

export class CreatePublicationDto {
  @ApiProperty({ example: 'gitlab-legolas-mirkwood-01' })
  @IsString()
  repoId: string;

  @ApiProperty({ example: 'Mirkwood Chronicles' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'A stealth archer adventure set in the forests of Eryn Lasgalen.',
  })
  @IsString()
  shortDescription: string;

  @ApiProperty({ enum: PubType })
  @IsEnum(PubType)
  type: PubType;

  @ApiProperty({ enum: EsrbRating })
  @IsEnum(EsrbRating)
  esrbRating: EsrbRating;

  @ApiProperty({ enum: Platform, isArray: true })
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[];

  @ApiProperty({ type: [String], example: ['stealth', 'archery', 'adventure'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 2024 })
  @IsInt()
  releaseYear: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/mirkwood-thumb.png',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: VcsProvider, example: 'gitlab' })
  @IsOptional()
  @IsEnum(VcsProvider)
  vcsProvider?: VcsProvider;
}

export class UpdatePublicationDto {
  @ApiPropertyOptional({
    example: 'Mirkwood Chronicles: Shadows of Dol Guldur',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ enum: PubType })
  @IsOptional()
  @IsEnum(PubType)
  type?: PubType;

  @ApiPropertyOptional({ enum: EsrbRating })
  @IsOptional()
  @IsEnum(EsrbRating)
  esrbRating?: EsrbRating;

  @ApiPropertyOptional({ enum: Platform, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms?: Platform[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  releaseYear?: number;

  @ApiPropertyOptional({ enum: PublicationStatus })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumb.png' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class ReportsHistoryReplyDto {
  @ApiProperty({
    example: 'I have updated the thumbnail as requested.',
    description: 'Reply message to the admin',
  })
  @IsString()
  message: string;
}

export class UpdateRatingDto {
  @ApiProperty({ description: 'Delta to apply to totalRating', example: 4 })
  @IsInt()
  ratingDelta: number;

  @ApiProperty({
    description: 'Delta to apply to totalReviews (negative to decrement)',
    example: 1,
  })
  @IsInt()
  reviewsDelta: number;
}

export class FilterPublicationsDto {
  @ApiPropertyOptional({ example: 'mirkwood' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PubType, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(PubType, { each: true })
  types?: PubType[];

  @ApiPropertyOptional({ enum: EsrbRating, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(EsrbRating, { each: true })
  esrbRatings?: EsrbRating[];

  @ApiPropertyOptional({ enum: Platform, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(Platform, { each: true })
  platforms?: Platform[];

  @ApiPropertyOptional({ type: [String], example: ['archery'] })
  @IsOptional()
  @Transform(toArray)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearFrom?: number;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2100)
  yearTo?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class PublicationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() repoId: string;
  @ApiProperty() authorId: string;
  @ApiProperty() title: string;
  @ApiProperty() shortDescription: string;
  @ApiProperty({ enum: PubType }) type: PubType;
  @ApiProperty({ enum: EsrbRating }) esrbRating: EsrbRating;
  @ApiProperty({ enum: Platform, isArray: true }) platforms: Platform[];
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty() releaseYear: number;
  @ApiProperty({ enum: PublicationStatus }) status: PublicationStatus;
  @ApiProperty() totalRating: number;
  @ApiProperty() totalReviews: number;
  @ApiProperty() averageRating: number;
  @ApiProperty() downloads: number;
  @ApiProperty({ nullable: true }) thumbnailUrl: string | null;
  @ApiProperty({ nullable: true }) repoDetailsId: string | null;
  @ApiProperty({ enum: VcsProvider, nullable: true })
  vcsProvider: VcsProvider | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedPublicationsDto {
  @ApiProperty({ type: [PublicationResponseDto] })
  data: PublicationResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class FullPublicationResponseDto {
  @ApiProperty({ type: PublicationResponseDto })
  publication: PublicationResponseDto;
  @ApiProperty({ nullable: true })
  details: PublicationDetailsResponseDto | null;
}

export function toFullPublicationResponse(
  pub: Publication,
  details: PublicationDetails | null,
): FullPublicationResponseDto {
  return {
    publication: toPublicationResponse(pub),
    details: details ? toPublicationDetailsResponse(details) : null,
  };
}

export function toPublicationResponse(
  pub: Publication,
): PublicationResponseDto {
  return {
    id: pub.id ?? '',
    repoId: pub.repoId,
    authorId: pub.authorId,
    title: pub.title,
    shortDescription: pub.shortDescription,
    type: pub.type,
    esrbRating: pub.esrbRating,
    platforms: pub.platforms,
    tags: pub.tags,
    releaseYear: pub.releaseYear,
    status: pub.status,
    totalRating: pub.totalRating,
    totalReviews: pub.totalReviews,
    averageRating: pub.averageRating,
    downloads: pub.downloads,
    thumbnailUrl: pub.thumbnailUrl ?? null,
    repoDetailsId: pub.repoDetailsId ?? null,
    vcsProvider: pub.vcsProvider ?? null,
    createdAt: pub.createdAt,
    updatedAt: pub.updatedAt,
  };
}
