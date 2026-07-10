import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Review } from '../../domain/entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ example: 'gitlab-legolas-mirkwood-01' })
  @IsString()
  repoId: string;

  @ApiProperty({ example: 'mongo-id-release-mirkwood-01' })
  @IsString()
  releaseId: string;

  @ApiProperty({
    example: 4,
    description: 'Rating from 1 (lowest) to 5 (highest)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'A masterful stealth experience' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'An excellent stealth game. The Mirkwood atmosphere is spot on.',
  })
  @IsString()
  comment: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 'Updated title after new patch' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated: The new patch improved performance significantly.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Rating from 1 (lowest) to 5 (highest)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ReviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() repoId: string;
  @ApiProperty() releaseId: string;
  @ApiProperty() authorId: string;
  @ApiProperty({
    example: 'Legolas',
    description: 'Display name of the review author',
  })
  authorName: string;
  @ApiProperty() rating: number;
  @ApiProperty() title: string;
  @ApiProperty() comment: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedReviewsDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  data: ReviewResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class GetAllReviewsQueryDto {
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

export class GetByReleaseQueryDto {
  @ApiProperty({ example: 'gitlab-legolas-mirkwood-01' })
  @IsString()
  repoId: string;

  @ApiProperty({ example: 'mongo-id-release-mirkwood-01' })
  @IsString()
  releaseId: string;

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

export function toReviewResponse(
  review: Review,
  authorName = 'Usuario desconocido',
): ReviewResponseDto {
  return {
    id: review.id ?? '',
    repoId: review.repoId,
    releaseId: review.releaseId,
    authorId: review.authorId,
    authorName,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
