import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateReviewDto,
  PaginatedReviewsDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../../application/dto/review.dto';

const ok = (desc: string) =>
  ApiResponse({ status: 200, description: desc, type: ReviewResponseDto });
const paginated = () =>
  ApiResponse({
    status: 200,
    description: 'Paginated list of reviews',
    type: PaginatedReviewsDto,
  });
const notFound = () =>
  ApiResponse({ status: 404, description: 'Review not found' });
const forbidden = () =>
  ApiResponse({ status: 403, description: 'Forbidden: not the owner' });
const badRequest = () =>
  ApiResponse({ status: 400, description: 'Validation error' });
const jwt = () => ApiBearerAuth('JWT-auth');

export const ApiCreate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Post a review on a release',
      description:
        'Creates a review for a specific release. The authorId is taken from the JWT. ' +
        'On success: updates totalRating and totalReviews on the publication, the release, and the publication author stats (fire-and-forget).',
    }),
    ApiBody({ type: CreateReviewDto }),
    ApiResponse({
      status: 201,
      description: 'Review created successfully',
      type: ReviewResponseDto,
    }),
    badRequest(),
  );

export const ApiGetAll = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all reviews (paginated)',
      description:
        'Returns all reviews sorted by creation date (newest first).',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    paginated(),
  );

export const ApiGetByAuthor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all reviews posted by a contributor',
      description:
        'Returns all reviews written by a specific contributor, sorted by creation date.',
    }),
    ApiQuery({
      name: 'authorId',
      required: true,
      description: 'The userId of the reviewer',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiResponse({
      status: 200,
      description: 'Reviews by author',
      type: [ReviewResponseDto],
    }),
  );

export const ApiGetByRelease = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get reviews for a specific release (paginated)',
      description:
        'Returns all reviews for the given repoId and releaseId, sorted newest first.',
    }),
    ApiQuery({
      name: 'repoId',
      required: true,
      example: 'gitlab-legolas-mirkwood-01',
    }),
    ApiQuery({
      name: 'releaseId',
      required: true,
      description: 'MongoDB id of the release',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    paginated(),
  );

export const ApiUpdate = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Update a review (owner or admin)',
      description:
        'Updates the title, comment, and/or rating of a review. At least one field must be provided. Only the owner or an admin can update a review. ' +
        'If the rating changes, the cascade updates totalRating on the publication, release, and publication author stats (fire-and-forget).',
    }),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'MongoDB id of the review',
    }),
    ApiBody({ type: UpdateReviewDto }),
    ok('Review updated successfully'),
    notFound(),
    forbidden(),
    badRequest(),
  );

export const ApiDelete = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Delete a review (owner or admin)',
      description:
        'Deletes a review and reverses the cascade: decrements totalRating and totalReviews on the publication, release, and author stats (fire-and-forget).',
    }),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'MongoDB id of the review',
    }),
    ApiResponse({ status: 204, description: 'Review deleted successfully' }),
    notFound(),
    forbidden(),
  );
