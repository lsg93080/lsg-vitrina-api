import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { RolesGuard } from '@/presentation/http/guards/roles.guard';
import { ApiKeyGuard } from '@/presentation/http/guards/api-key.guard';
import { Roles } from '@/presentation/http/decorators/roles.decorator';
import { Role } from '@/presentation/http/decorators/role.enum';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import { GetPublicationUseCase } from '@/publications/application/use-cases/get-publication.use-case';
import { GetPublicationDetailsUseCase } from '../../application/use-cases/get-publication-details.use-case';
import { CreatePublicationDetailsUseCase } from '../../application/use-cases/create-publication-details.use-case';
import { UpdatePublicationDetailsUseCase } from '../../application/use-cases/update-publication-details.use-case';
import { DeletePublicationDetailsUseCase } from '../../application/use-cases/delete-publication-details.use-case';
import { ReleasesUseCase } from '../../application/use-cases/releases.use-case';
import {
  CreatePublicationDetailsDto,
  CreateReleaseDto,
  GetReleasesQueryDto,
  PaginatedReleasesDto,
  PublicationDetailsResponseDto,
  ReleaseResponseDto,
  UpdatePublicationDetailsDto,
  UpdateReleaseDto,
  UpdateReleaseRatingDto,
  toPublicationDetailsResponse,
  toReleaseResponse,
} from '../../application/dto/publication-details.dto';
import {
  ApiCreateDetails,
  ApiCreateRelease,
  ApiDeleteDetails,
  ApiDeleteRelease,
  ApiGetAllDetails,
  ApiGetDetailsByRepoId,
  ApiGetReleaseById,
  ApiGetReleases,
  ApiPublicationDetailsTags,
  ApiUpdateDetails,
  ApiUpdateRelease,
  ApiUpdateReleaseRating,
} from '../swagger/publication-details.swagger';

@ApiPublicationDetailsTags()
@Controller('publication-details')
export class PublicationDetailsController {
  constructor(
    private readonly getUseCase: GetPublicationDetailsUseCase,
    private readonly createUseCase: CreatePublicationDetailsUseCase,
    private readonly updateUseCase: UpdatePublicationDetailsUseCase,
    private readonly deleteUseCase: DeletePublicationDetailsUseCase,
    private readonly releasesUseCase: ReleasesUseCase,
    private readonly getPublicationUseCase: GetPublicationUseCase,
  ) {}

  @Get()
  @ApiGetAllDetails()
  async getAll(): Promise<PublicationDetailsResponseDto[]> {
    const all = await this.getUseCase.getAll();
    return all.map(toPublicationDetailsResponse);
  }

  @Get('find')
  @ApiGetDetailsByRepoId()
  async getByRepoId(
    @Query('repoId') repoId: string,
  ): Promise<PublicationDetailsResponseDto> {
    const details = await this.getUseCase.getByRepoId(repoId);
    return toPublicationDetailsResponse(details);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateDetails()
  async create(
    @Body() dto: CreatePublicationDetailsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PublicationDetailsResponseDto> {
    const details = await this.createUseCase.execute({
      repoId: dto.repoId,
      authorId: user.userId,
      longDescription: dto.longDescription,
      repoUrl: dto.repoUrl,
      license: dto.license,
      defaultBranch: dto.defaultBranch,
      repoDoc: dto.repoDoc,
      images: dto.images,
    });
    return toPublicationDetailsResponse(details);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiUpdateDetails()
  async update(
    @Query('repoId') repoId: string,
    @Body() dto: UpdatePublicationDetailsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PublicationDetailsResponseDto> {
    const existing = await this.getUseCase.getByRepoId(repoId);
    if (existing.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this publication');
    }
    const updated = await this.updateUseCase.update(repoId, dto);
    return toPublicationDetailsResponse(updated);
  }

  @Put('rating')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUpdateReleaseRating()
  async updateReleaseRating(
    @Query('releaseId') releaseId: string,
    @Body() dto: UpdateReleaseRatingDto,
  ): Promise<void> {
    await this.updateUseCase.updateReleaseRating(releaseId, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteDetails()
  async delete(
    @Query('id') id: string,
    @Query('repoId') repoId: string,
  ): Promise<void> {
    await this.deleteUseCase.execute(id, repoId);
  }

  @Get('releases')
  @ApiGetReleases()
  async getReleases(
    @Query('repoId') repoId: string,
    @Query() query: GetReleasesQueryDto,
  ): Promise<PaginatedReleasesDto> {
    const { data, total } = await this.releasesUseCase.getByRepoId(
      repoId,
      query.page,
      query.limit,
    );
    return {
      data: data.map(toReleaseResponse),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  @Get('releases/find')
  @ApiGetReleaseById()
  async getReleaseById(@Query('id') id: string): Promise<ReleaseResponseDto> {
    const release = await this.releasesUseCase.getById(id);
    return toReleaseResponse(release);
  }

  @Post('releases')
  @UseGuards(JwtAuthGuard)
  @ApiCreateRelease()
  async createRelease(
    @Query('repoId') repoId: string,
    @Body() dto: CreateReleaseDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ReleaseResponseDto> {
    const publication = await this.getPublicationUseCase.getByRepoId(repoId);
    if (
      publication.authorId !== user.userId &&
      !user.roles.includes(Role.ADMIN)
    ) {
      throw new ForbiddenException('You do not own this publication');
    }
    const release = await this.releasesUseCase.create({
      repoId,
      version: dto.version,
      title: dto.title,
      shortDescription: dto.shortDescription,
      releaseNotes: dto.releaseNotes,
      releaseDate: dto.releaseDate,
      downloadUrl: dto.downloadUrl,
    });
    return toReleaseResponse(release);
  }

  @Put('releases')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateRelease()
  async updateRelease(
    @Query('id') id: string,
    @Body() dto: UpdateReleaseDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ReleaseResponseDto> {
    const release = await this.releasesUseCase.getById(id);
    const publication = await this.getPublicationUseCase.getByRepoId(
      release.repoId,
    );
    if (
      publication.authorId !== user.userId &&
      !user.roles.includes(Role.ADMIN)
    ) {
      throw new ForbiddenException('You do not own this publication');
    }
    const updated = await this.releasesUseCase.update(id, dto);
    return toReleaseResponse(updated);
  }

  @Delete('releases')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteRelease()
  async deleteRelease(
    @Query('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const release = await this.releasesUseCase.getById(id);
    const publication = await this.getPublicationUseCase.getByRepoId(
      release.repoId,
    );
    if (
      publication.authorId !== user.userId &&
      !user.roles.includes(Role.ADMIN)
    ) {
      throw new ForbiddenException('You do not own this publication');
    }
    await this.releasesUseCase.delete(id);
  }
}
