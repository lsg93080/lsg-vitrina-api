import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateReportDto,
  PaginatedReportsDto,
  ReportResponseDto,
  ResolveReportDto,
} from '../../application/dto/report.dto';
import { ReportStatus } from '../../domain/value-objects/report-reason.vo';

const ok = (desc: string) =>
  ApiResponse({ status: 200, description: desc, type: ReportResponseDto });
const notFound = () =>
  ApiResponse({ status: 404, description: 'Report not found' });
const badRequest = () =>
  ApiResponse({ status: 400, description: 'Validation error' });
const jwt = () => ApiBearerAuth('JWT-auth');

export const ApiCreate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Submit a report against a publication',
      description:
        'Any authenticated user can report a publication. ' +
        'The reporterId is taken from the JWT. ' +
        'Reports are queued with status "pending" until an admin resolves them.',
    }),
    ApiBody({ type: CreateReportDto }),
    ApiResponse({
      status: 201,
      description: 'Report submitted successfully',
      type: ReportResponseDto,
    }),
    badRequest(),
  );

export const ApiGetAll = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Get filtered reports (admin only)',
      description:
        'Returns paginated reports. Supports optional filters by publicationId and status. ' +
        'Results are sorted by creation date (newest first). ' +
        'Requires the admin role.',
    }),
    ApiQuery({
      name: 'publicationId',
      required: false,
      description: 'Filter by publication MongoDB id',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ReportStatus,
      description: 'Filter by report status',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Paginated reports',
      type: PaginatedReportsDto,
    }),
    ApiResponse({ status: 403, description: 'Forbidden: admin role required' }),
  );

export const ApiGetById = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Get a single report by id (admin only)',
      description: 'Requires the admin role.',
    }),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'MongoDB id of the report',
    }),
    ok('Report found'),
    notFound(),
    ApiResponse({ status: 403, description: 'Forbidden: admin role required' }),
  );

export const ApiResolve = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Resolve a report (admin only)',
      description:
        'Resolves a pending report with one of three actions:\n' +
        '- **dismiss**: closes the report with no further action.\n' +
        '- **warn**: records a warning for the publication author (no automated action).\n' +
        '- **suspend**: sets Publication.status to "suspended" (fire-and-forget) and closes the report.\n\n' +
        'Only reports with status "pending" can be resolved. Requires the admin role.',
    }),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'MongoDB id of the report',
    }),
    ApiBody({ type: ResolveReportDto }),
    ok('Report resolved successfully'),
    notFound(),
    ApiResponse({ status: 409, description: 'Report is already resolved' }),
    ApiResponse({ status: 403, description: 'Forbidden: admin role required' }),
  );
