import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SubmitVerdictDto {
  @ApiProperty({ description: 'Whether the publication is safe' })
  @IsBoolean()
  isSafe: boolean;

  @ApiPropertyOptional({ description: 'Optional comment about the verdict' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class AssignmentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by publication repo ID' })
  @IsOptional()
  @IsString()
  publicationRepoId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
