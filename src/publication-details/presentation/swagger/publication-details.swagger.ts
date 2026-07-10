import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginatedReleasesDto,
  PublicationDetailsResponseDto,
  ReleaseResponseDto,
} from '../../application/dto/publication-details.dto';

export function ApiPublicationDetailsTags() {
  return ApiTags('Publication Details');
}

export function ApiGetAllDetails() {
  return applyDecorators(
    ApiOperation({ summary: 'List all publication details' }),
    ApiResponse({
      status: HttpStatus.OK,
      type: [PublicationDetailsResponseDto],
    }),
  );
}

export function ApiGetDetailsByRepoId() {
  return applyDecorators(
    ApiOperation({ summary: 'Get publication details by repoId' }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: HttpStatus.OK, type: PublicationDetailsResponseDto }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
  );
}

export function ApiCreateDetails() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Create publication details (owner)' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      type: PublicationDetailsResponseDto,
    }),
    ApiResponse({ status: HttpStatus.CONFLICT }),
  );
}

export function ApiUpdateDetails() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Update publication details (owner or admin)' }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: HttpStatus.OK, type: PublicationDetailsResponseDto }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden: not the owner or admin',
    }),
  );
}

export function ApiUpdateReleaseRating() {
  return applyDecorators(
    ApiSecurity('API-key'),
    ApiOperation({ summary: 'Update release rating (internal, API key)' }),
    ApiQuery({ name: 'releaseId', required: true }),
    ApiResponse({ status: HttpStatus.NO_CONTENT }),
  );
}

export function ApiDeleteDetails() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Delete publication details (admin)' }),
    ApiQuery({ name: 'id', required: true }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: HttpStatus.NO_CONTENT }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden: admin role required',
    }),
  );
}

export function ApiGetReleases() {
  return applyDecorators(
    ApiOperation({ summary: 'List releases for a publication (paginated)' }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: HttpStatus.OK, type: PaginatedReleasesDto }),
  );
}

export function ApiGetReleaseById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a release by id' }),
    ApiQuery({ name: 'id', required: true }),
    ApiResponse({ status: HttpStatus.OK, type: ReleaseResponseDto }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
  );
}

export function ApiUpdateRelease() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Update a release (owner or admin)' }),
    ApiQuery({ name: 'id', required: true }),
    ApiResponse({ status: HttpStatus.OK, type: ReleaseResponseDto }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden: not the owner or admin',
    }),
  );
}

export function ApiDeleteRelease() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Delete a release (owner or admin)' }),
    ApiQuery({ name: 'id', required: true }),
    ApiResponse({ status: HttpStatus.NO_CONTENT }),
    ApiResponse({ status: HttpStatus.NOT_FOUND }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden: not the owner or admin',
    }),
  );
}

export function ApiCreateRelease() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Add a release to a publication (owner)' }),
    ApiQuery({ name: 'repoId', required: true }),
    ApiResponse({ status: HttpStatus.CREATED, type: ReleaseResponseDto }),
  );
}
