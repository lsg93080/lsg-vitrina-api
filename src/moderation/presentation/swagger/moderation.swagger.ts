import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const jwt = () => ApiBearerAuth('JWT-auth');
const unauthorized = () =>
  ApiResponse({
    status: 401,
    description: 'Unauthorized: missing or invalid JWT',
  });
const forbidden = () =>
  ApiResponse({
    status: 403,
    description: 'Forbidden: insufficient permissions',
  });
const notFound = () =>
  ApiResponse({ status: 404, description: 'Assignment not found' });

export const ApiGetMyAssignments = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Get pending reviewer assignments for the current user',
      description:
        'Returns all assignments in PENDING status for the authenticated reviewer.',
    }),
    ApiResponse({
      status: 200,
      description: 'List of pending assignments',
    }),
    unauthorized(),
  );

export const ApiGetMyAssignmentsHistory = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Get completed reviewer assignments for the current user',
      description:
        'Returns paginated DONE assignments for the authenticated reviewer.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of completed assignments',
    }),
    unauthorized(),
  );

export const ApiSubmitVerdict = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Submit a safety verdict for an assigned publication',
      description:
        'Allows the assigned reviewer to submit their verdict (isSafe flag and optional comment). ' +
        'After submission, the moderation evaluation runs in the background.',
    }),
    ApiParam({
      name: 'id',
      description: 'MongoDB ObjectId of the reviewer assignment',
    }),
    ApiResponse({ status: 201, description: 'Verdict submitted successfully' }),
    unauthorized(),
    forbidden(),
    notFound(),
    ApiResponse({
      status: 409,
      description: 'Conflict: verdict already submitted for this assignment',
    }),
  );

export const ApiGetAllAssignments = () =>
  applyDecorators(
    jwt(),
    ApiOperation({
      summary: 'Get all reviewer assignments (admin only)',
      description:
        'Returns paginated reviewer assignments. Optionally filter by publicationRepoId.',
    }),
    ApiQuery({
      name: 'publicationRepoId',
      required: false,
      description: 'Filter assignments by publication repo ID',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of all assignments',
    }),
    unauthorized(),
    forbidden(),
  );
