import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContributorResponseDto } from '../../application/dto/contributor.dto';

const ok = (desc: string) =>
  ApiResponse({ status: 200, description: desc, type: ContributorResponseDto });
const arr = (desc: string) =>
  ApiResponse({
    status: 200,
    description: desc,
    type: [ContributorResponseDto],
  });
const notFound = () =>
  ApiResponse({ status: 404, description: 'Contributor not found' });
const jwt = () => ApiBearerAuth('JWT-auth');

export const ApiGetAll = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all contributor profiles' }),
    arr('All contributors'),
  );
export const ApiGetAllActive = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get contributors with at least one publication' }),
    arr('Active contributors'),
  );
export const ApiFind = () =>
  applyDecorators(
    ApiOperation({ summary: 'Find contributor by MongoDB id' }),
    ok('Contributor found'),
    notFound(),
  );
export const ApiCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check whether a contributor profile exists for a given userId',
    }),
    ApiResponse({ status: 200, schema: { example: { exists: true } } }),
  );
export const ApiGetTops = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get top contributors sorted by a stat field' }),
    ApiQuery({
      name: 'orderBy',
      enum: ['postsQty', 'totalRating', 'downloads'],
      required: false,
    }),
    ApiQuery({ name: 'orderMode', enum: ['asc', 'desc'], required: false }),
    ApiQuery({ name: 'limit', type: Number, required: false }),
    arr('Top contributors'),
  );
export const ApiGetTopRated = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Get top-rated contributors using Bayesian scoring (min reviews threshold)',
    }),
    ApiQuery({
      name: 'threshold',
      type: Number,
      required: false,
      description: 'Minimum totalComments to be ranked (default: 3)',
    }),
    arr('Top-rated contributors'),
  );
export const ApiFilter = () =>
  applyDecorators(
    ApiOperation({ summary: 'Search contributors by username substring' }),
    ApiQuery({ name: 'search', required: false }),
    arr('Matching contributors'),
  );
export const ApiCreate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Create contributor profile for the authenticated user',
    }),
    ok('Contributor created'),
  );
export const ApiUpdate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({ summary: 'Update contributor profile' }),
    ApiQuery({ name: 'userId', required: true }),
    ok('Updated contributor'),
    notFound(),
  );
export const ApiUpdateRating = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary:
        'Apply stat deltas (comments, rating, downloads) to a contributor',
    }),
    ApiQuery({ name: 'userId', required: true }),
    ApiResponse({ status: 200, description: 'Stats updated' }),
    notFound(),
  );
export const ApiUpdateContrInfo = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary:
        'Update contributor display info (username, avatar, socials, etc.)',
    }),
    ApiQuery({ name: 'userId', required: true }),
    ok('Updated contributor'),
    notFound(),
  );
