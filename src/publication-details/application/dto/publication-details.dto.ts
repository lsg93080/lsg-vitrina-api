import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import { Release, ReleaseStatus } from '../../domain/value-objects/release.vo';

export class CreatePublicationDetailsDto {
  @ApiProperty({ example: 'gitlab-legolas-mirkwood-01' })
  @IsString()
  repoId: string;

  @ApiProperty({ example: 'A deep dive into the shadows of Mirkwood forest.' })
  @IsString()
  longDescription: string;

  @ApiProperty({ example: 'https://gitlab.com/legolas/mirkwood-chronicles' })
  @IsString()
  repoUrl: string;

  @ApiPropertyOptional({ example: 'MIT' })
  @IsOptional()
  @IsString()
  license: string = '';

  @ApiProperty({ example: 'main' })
  @IsString()
  defaultBranch: string;

  @ApiPropertyOptional({
    example: '# Mirkwood Chronicles\n\nA stealth game...',
  })
  @IsOptional()
  @IsString()
  repoDoc: string = '';

  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.example.com/mirkwood-1.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[] = [];
}

export class UpdatePublicationDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  license?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repoDoc?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateReleaseRatingDto {
  @ApiProperty({ description: 'Delta to apply to totalRating', example: 4 })
  @IsInt()
  ratingDelta: number;

  @ApiProperty({ description: 'Delta to apply to totalReviews', example: 1 })
  @IsInt()
  reviewsDelta: number;
}

export class CreateReleaseDto {
  @ApiProperty({ example: 'v1.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'The Greenwood Awakens' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Initial release with core stealth mechanics.' })
  @IsString()
  shortDescription: string;

  @ApiPropertyOptional({
    example: '## Changelog\n- Added stealth system\n- Added archery',
  })
  @IsOptional()
  @IsString()
  releaseNotes: string = '';

  @ApiProperty({ example: '2024-03-15T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  releaseDate: Date;

  @ApiPropertyOptional({
    example: 'https://gitlab.com/legolas/mirkwood/-/releases/v1.0.0',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;
}

export class UpdateReleaseDto {
  @ApiPropertyOptional({ example: 'v1.1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'The Greenwood Awakens: Patch' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Bug fixes and performance improvements.' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: '## Changelog\n- Fixed crash on startup' })
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiPropertyOptional({ example: '2024-04-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  @ApiPropertyOptional({
    example: 'https://gitlab.com/legolas/mirkwood/-/releases/v1.1.0',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;
}

export class ReleaseResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() repoId: string;
  @ApiProperty() version: string;
  @ApiProperty() title: string;
  @ApiProperty() shortDescription: string;
  @ApiProperty() releaseNotes: string;
  @ApiProperty() releaseDate: Date;
  @ApiProperty({ nullable: true }) downloadUrl: string | null;
  @ApiProperty({ enum: ReleaseStatus }) status: ReleaseStatus;
  @ApiProperty() totalRating: number;
  @ApiProperty() totalReviews: number;
  @ApiProperty() averageRating: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedReleasesDto {
  @ApiProperty({ type: [ReleaseResponseDto] }) data: ReleaseResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class GetReleasesQueryDto {
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

export class PublicationDetailsResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() repoId: string;
  @ApiProperty() authorId: string;
  @ApiProperty() longDescription: string;
  @ApiProperty() repoUrl: string;
  @ApiProperty() license: string;
  @ApiProperty() defaultBranch: string;
  @ApiProperty() repoDoc: string;
  @ApiProperty({ type: [String] }) images: string[];
  @ApiProperty({ type: [String] }) reviewers: string[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export function toPublicationDetailsResponse(
  details: PublicationDetails,
): PublicationDetailsResponseDto {
  return {
    id: details.id ?? '',
    repoId: details.repoId,
    authorId: details.authorId,
    longDescription: details.longDescription,
    repoUrl: details.repoUrl,
    license: details.license,
    defaultBranch: details.defaultBranch,
    repoDoc: details.repoDoc,
    images: details.images,
    reviewers: details.reviewers,
    createdAt: details.createdAt,
    updatedAt: details.updatedAt,
  };
}

export function toReleaseResponse(release: Release): ReleaseResponseDto {
  return {
    id: release.id ?? '',
    repoId: release.repoId,
    version: release.version,
    title: release.title,
    shortDescription: release.shortDescription,
    releaseNotes: release.releaseNotes,
    releaseDate: release.releaseDate,
    downloadUrl: release.downloadUrl ?? null,
    status: release.status,
    totalRating: release.totalRating,
    totalReviews: release.totalReviews,
    averageRating: release.averageRating,
    createdAt: release.createdAt,
    updatedAt: release.updatedAt,
  };
}
