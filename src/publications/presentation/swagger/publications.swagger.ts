import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  FullPublicationResponseDto,
  PaginatedPublicationsDto,
  PublicationResponseDto,
} from '../../application/dto/publication.dto';

const ok = (desc: string) =>
  ApiResponse({ status: 200, description: desc, type: PublicationResponseDto });
const notFound = () =>
  ApiResponse({ status: 404, description: 'Publication not found' });
const jwt = () => ApiBearerAuth('JWT-auth');

export const ApiFilter = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List and filter publications (faceted search with HTTP cache)',
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated publications',
      type: PaginatedPublicationsDto,
    }),
  );

export const ApiFind = () =>
  applyDecorators(
    ApiOperation({ summary: 'Find publication by MongoDB id' }),
    ok('Publication found'),
    notFound(),
  );

export const ApiGetByAuthor = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all publications by a contributor' }),
    ApiQuery({ name: 'contrId', required: true }),
    ApiResponse({
      status: 200,
      description: 'Publications by author',
      type: [PublicationResponseDto],
    }),
  );

export const ApiGetTops = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get top publications sorted by a stat field' }),
    ApiQuery({
      name: 'orderBy',
      enum: ['totalRating', 'downloads', 'totalReviews'],
      required: false,
    }),
    ApiQuery({ name: 'orderMode', enum: ['asc', 'desc'], required: false }),
    ApiQuery({ name: 'limit', type: Number, required: false }),
    ApiResponse({
      status: 200,
      description: 'Top publications',
      type: [PublicationResponseDto],
    }),
  );

export const ApiGetTopRated = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Get top-rated publications using Bayesian scoring (min reviews threshold)',
    }),
    ApiQuery({
      name: 'threshold',
      type: Number,
      required: false,
      description: 'Minimum totalReviews to be ranked (default: 3)',
    }),
    ApiResponse({
      status: 200,
      description: 'Top-rated publications',
      type: [PublicationResponseDto],
    }),
  );

export const ApiCreate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary:
        'Create a publication. Grants developer role in Auth Service if not already set.',
    }),
    ApiResponse({
      status: 201,
      description: 'Publication created',
      type: PublicationResponseDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Publication with this repoId already exists',
    }),
  );

export const ApiUpdate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({ summary: 'Update a publication (owner or admin)' }),
    ApiQuery({ name: 'repoId', required: true }),
    ok('Updated publication'),
    notFound(),
    ApiResponse({ status: 403, description: 'Forbidden: not the owner' }),
  );

export const ApiUpdateRating = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary:
        'Apply rating deltas to a publication (called by Reviews on create/delete)',
    }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: 204, description: 'Rating updated' }),
    notFound(),
  );

export const ApiDelete = () =>
  applyDecorators(
    jwt(),
    ApiOperation({ summary: 'Delete a publication (owner or admin)' }),
    ApiQuery({ name: 'id', required: true }),
    ApiResponse({ status: 204, description: 'Publication deleted' }),
    notFound(),
    ApiResponse({ status: 403, description: 'Forbidden: not the owner' }),
  );

export const ApiVerifyRepo = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Verify GitLab repo ownership',
      description:
        'Checks that the authenticated user has maintainer or owner access (access_level >= 40) on the given GitLab project. ' +
        'Only meaningful when the user has a GitLab OAuth connection in Auth Service.',
    }),
    ApiParam({ name: 'repoId', description: 'GitLab project id or path' }),
    ApiResponse({ status: 200, description: 'Ownership verified' }),
    ApiResponse({
      status: 403,
      description:
        'No GitLab connection or insufficient access on the repository',
    }),
  );

export const ApiDownload = () =>
  applyDecorators(
    ApiOperation({ summary: 'Increment download counter for a publication' }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: 204, description: 'Download counted' }),
    notFound(),
  );

export const ApiGetFull = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get full publication (publication + details in one response)',
    }),
    ApiParam({ name: 'repoId', description: 'Repository identifier' }),
    ApiResponse({
      status: 200,
      description: 'Full publication data',
      type: FullPublicationResponseDto,
    }),
    notFound(),
  );
