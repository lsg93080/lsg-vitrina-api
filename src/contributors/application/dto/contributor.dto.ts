import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Platform } from '../../domain/value-objects/platform.enum';
import { SocialPlatform } from '../../domain/value-objects/social-platform.enum';

export class CreateContributorDto {
  @ApiProperty({ example: '7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'legolas@mirkwood.me' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'legolas' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/legolas.png' })
  @IsOptional()
  @IsString()
  imgUrl?: string;
}

export class UpdateContributorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReviewer?: boolean;

  @ApiPropertyOptional({ enum: Platform, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms?: Platform[];
}

export class UpdateStatsDto {
  @ApiProperty({
    description: 'Delta to apply to totalComments (negative to decrement)',
    example: 1,
  })
  @IsNumber()
  commentsDelta: number;

  @ApiProperty({ description: 'Delta to apply to totalRating', example: 4 })
  @IsNumber()
  ratingDelta: number;

  @ApiProperty({ description: 'Delta to apply to downloads', example: 0 })
  @IsNumber()
  downloadsDelta: number;
}

// Social links payload: each key is a SocialPlatform enum value, value is the URL or handle.
export class SocialsDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  discord?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  steam?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  github?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  gitlab?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  twitter?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkedin?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  youtube?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reddit?: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  website?: string;
}

export class UpdateContrInfoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imgUrl?: string;
  @ApiPropertyOptional({
    maxLength: 60,
    description: 'Short bio (max 60 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() postsQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() videogamesQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() extensionsQty?: number;
  @ApiPropertyOptional({
    type: SocialsDto,
    description: 'Social links, full replace on each save',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialsDto)
  socials?: SocialsDto;
}

export class ContrInfoResponseDto {
  @ApiProperty() username: string;
  @ApiProperty() imgUrl: string;
  @ApiProperty() bio: string;
  @ApiProperty() postsQty: number;
  @ApiProperty() videogamesQty: number;
  @ApiProperty() extensionsQty: number;
  @ApiProperty() lastPost: Date | null;
  @ApiProperty() totalComments: number;
  @ApiProperty() totalRating: number;
  @ApiProperty() downloads: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Social links keyed by SocialPlatform enum values',
  })
  socials: Partial<Record<SocialPlatform, string>>;
}

export class ContributorResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() email: string;
  @ApiProperty() isReviewer: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ enum: Platform, isArray: true }) platforms: Platform[];
  @ApiProperty({ type: ContrInfoResponseDto }) contrInfo: ContrInfoResponseDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
