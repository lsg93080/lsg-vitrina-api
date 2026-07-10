import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Report } from '../../domain/entities/report.entity';
import {
  ReportReason,
  ReportStatus,
} from '../../domain/value-objects/report-reason.vo';

export class CreateReportDto {
  @ApiProperty({ example: 'mongo-id-publication-01' })
  @IsString()
  publicationId: string;

  @ApiProperty({
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE,
    description: 'Reason for the report',
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    example:
      'This publication contains offensive imagery not suitable for all audiences.',
    description: 'Optional description providing more context for the report',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ResolveReportDto {
  @ApiProperty({
    enum: ['dismiss', 'warn', 'suspend'],
    example: 'warn',
    description: 'Action to take on the report',
  })
  @IsEnum(['dismiss', 'warn', 'suspend'])
  action: 'dismiss' | 'warn' | 'suspend';

  @ApiPropertyOptional({
    example: 'Please change the thumbnail, it violates our content policy.',
    description:
      'Message to the publication author (required for warn/suspend)',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class GetReportsQueryDto {
  @ApiPropertyOptional({
    example: 'mongo-id-publication-01',
    description: 'Filter by publication MongoDB id',
  })
  @IsOptional()
  @IsString()
  publicationId?: string;

  @ApiPropertyOptional({
    enum: ReportStatus,
    description: 'Filter by report status',
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    enum: ReportReason,
    description: 'Filter by report reason',
  })
  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Filter reports created on or after this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Filter reports created on or before this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

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

export class ReportResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() publicationId: string;
  @ApiProperty() reporterId: string;
  @ApiPropertyOptional() reporterName?: string;
  @ApiPropertyOptional() publicationAuthorName?: string;
  @ApiPropertyOptional() publicationStatus?: string;
  @ApiProperty({ enum: ReportReason }) reason: ReportReason;
  @ApiProperty() description: string;
  @ApiProperty({ enum: ReportStatus }) status: ReportStatus;
  @ApiProperty({ nullable: true }) resolvedBy: string | null;
  @ApiProperty({ nullable: true }) resolvedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedReportsDto {
  @ApiProperty({ type: [ReportResponseDto] })
  data: ReportResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export function toReportResponse(report: Report): ReportResponseDto {
  return {
    id: report.id ?? '',
    publicationId: report.publicationId,
    reporterId: report.reporterId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    resolvedBy: report.resolvedBy,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
