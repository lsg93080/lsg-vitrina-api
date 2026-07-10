import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { RolesGuard } from '@/presentation/http/guards/roles.guard';
import { ApiKeyGuard } from '@/presentation/http/guards/api-key.guard';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import { Roles } from '@/presentation/http/decorators/roles.decorator';
import { Role } from '@/presentation/http/decorators/role.enum';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
} from '@/contributors/domain/repositories/contributor.repository.interface';
import { UpdateContributorUseCase } from '@/contributors/application/use-cases/update-contributor.use-case';
import { CreatePublicationUseCase } from '../../application/use-cases/create-publication.use-case';
import { FilterPublicationsUseCase } from '../../application/use-cases/filter-publications.use-case';
import { GetPublicationUseCase } from '../../application/use-cases/get-publication.use-case';
import { UpdatePublicationUseCase } from '../../application/use-cases/update-publication.use-case';
import { DeletePublicationUseCase } from '../../application/use-cases/delete-publication.use-case';
import { VerifyRepoOwnershipUseCase } from '../../application/use-cases/verify-repo-ownership.use-case';
import { GetFullPublicationUseCase } from '../../application/use-cases/get-full-publication.use-case';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '../../domain/repositories/publication.repository.interface';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '@/reports/domain/repositories/report.repository.interface';
import {
  PubType,
  PublicationStatus,
} from '../../domain/value-objects/publication.vo';
import {
  CreatePublicationDto,
  FilterPublicationsDto,
  ReportsHistoryReplyDto,
  UpdatePublicationDto,
  UpdateRatingDto,
  toFullPublicationResponse,
  toPublicationResponse,
} from '../../application/dto/publication.dto';
import {
  ApiCreate,
  ApiDelete,
  ApiDownload,
  ApiFilter,
  ApiFind,
  ApiGetByAuthor,
  ApiGetFull,
  ApiGetTopRated,
  ApiGetTops,
  ApiUpdate,
  ApiUpdateRating,
  ApiVerifyRepo,
} from '../swagger/publications.swagger';

@ApiTags('Publications')
@Controller('publications')
export class PublicationsController {
  constructor(
    private readonly createUseCase: CreatePublicationUseCase,
    private readonly filterUseCase: FilterPublicationsUseCase,
    private readonly getUseCase: GetPublicationUseCase,
    private readonly updateUseCase: UpdatePublicationUseCase,
    private readonly deleteUseCase: DeletePublicationUseCase,
    private readonly verifyOwnershipUseCase: VerifyRepoOwnershipUseCase,
    private readonly getFullUseCase: GetFullPublicationUseCase,
    private readonly updateContributorUseCase: UpdateContributorUseCase,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  @ApiFilter()
  async filter(@Query() dto: FilterPublicationsDto) {
    const { data, total } = await this.filterUseCase.execute(dto);
    return {
      data: data.map(toPublicationResponse),
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  @Get('find')
  @ApiFind()
  async findById(@Query('id') id: string) {
    const pub = await this.getUseCase.getById(id);
    return toPublicationResponse(pub);
  }

  @Get('author')
  @ApiGetByAuthor()
  async getByAuthor(@Query('contrId') contrId: string) {
    const pubs = await this.getUseCase.getByAuthor(contrId);
    return pubs.map(toPublicationResponse);
  }

  @Get('stats')
  @ApiGetTops()
  async getTops(
    @Query('orderBy')
    orderBy: 'totalRating' | 'downloads' | 'totalReviews' = 'totalRating',
    @Query('orderMode') orderMode: 'asc' | 'desc' = 'desc',
    @Query('limit') limit = '10',
    @Query('type') type?: PubType,
  ) {
    const pubs = await this.getUseCase.getTops({
      orderBy,
      orderMode,
      limit: parseInt(limit, 10),
      type,
    });
    return pubs.map(toPublicationResponse);
  }

  @Get('stats/top')
  @ApiGetTopRated()
  async getTopRated(
    @Query('threshold') threshold = '3',
    @Query('type') type?: PubType,
  ) {
    const pubs = await this.getUseCase.getTopRated(
      parseInt(threshold, 10),
      type,
    );
    return pubs.map(toPublicationResponse);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreate()
  async create(
    @Body() dto: CreatePublicationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const pub = await this.createUseCase.execute({
      ...dto,
      authorId: user.userId,
      userRoles: user.roles,
    });
    return toPublicationResponse(pub);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiUpdate()
  async update(
    @Query('repoId') repoId: string,
    @Body() dto: UpdatePublicationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const existing = await this.getUseCase.getByRepoId(repoId);
    if (existing.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this publication');
    }
    const updated = await this.updateUseCase.update(repoId, dto);
    return toPublicationResponse(updated);
  }

  @Put('rating')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUpdateRating()
  async updateRating(
    @Query('repoId') repoId: string,
    @Body() dto: UpdateRatingDto,
  ) {
    await this.updateUseCase.updateRating(repoId, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDelete()
  async delete(@Query('id') id: string, @CurrentUser() user: CurrentUserData) {
    const existing = await this.getUseCase.getById(id);
    if (existing.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this publication');
    }
    await this.deleteUseCase.execute(id, existing.repoId);
  }

  @Post('download')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDownload()
  async download(@Query('repoId') repoId: string): Promise<void> {
    const publication = await this.getUseCase.getByRepoId(repoId);
    await this.updateUseCase.incrementDownloads(repoId);
    // Fire-and-forget: increment contributor download count
    void this.updateContributorUseCase
      .updateStats(publication.authorId, {
        commentsDelta: 0,
        ratingDelta: 0,
        downloadsDelta: 1,
      })
      .catch(() => {});
  }

  @Get('verify-repo/:repoId')
  @UseGuards(JwtAuthGuard)
  @ApiVerifyRepo()
  async verifyRepo(
    @Param('repoId') repoId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.verifyOwnershipUseCase.execute(user.userId, repoId);
    return { verified: true };
  }

  @Get('full/:repoId')
  @ApiGetFull()
  async getFull(@Param('repoId') repoId: string) {
    const { publication, details } = await this.getFullUseCase.execute(repoId);
    return toFullPublicationResponse(publication, details);
  }

  @Get(':repoId/reports-history')
  @UseGuards(JwtAuthGuard)
  async getReportsHistory(
    @Param('repoId') repoId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const pub = await this.getUseCase.getByRepoId(repoId);
    if (pub.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException(
        'Only the publication author or an admin can view reports history',
      );
    }
    return this.publicationRepo.getReportsHistory(repoId);
  }

  @Post(':repoId/reports-history')
  @UseGuards(JwtAuthGuard)
  async replyToReportsHistory(
    @Param('repoId') repoId: string,
    @Body() dto: ReportsHistoryReplyDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const pub = await this.getUseCase.getByRepoId(repoId);
    if (pub.authorId !== user.userId) {
      throw new ForbiddenException('Only the publication author can reply');
    }
    // Block replies after the conversation was closed by reactivation
    const history = await this.publicationRepo.getReportsHistory(repoId);
    if (
      history.length > 0 &&
      history[history.length - 1].action === 'reactivate'
    ) {
      throw new BadRequestException(
        'Cannot reply after publication has been reactivated',
      );
    }

    const contributor = await this.contributorRepo.findByUserId(user.userId);
    const authorName = contributor?.contrInfo.username ?? 'Author';

    await this.publicationRepo.pushReportsHistoryEntry(repoId, {
      action: 'reply',
      message: dto.message,
      authorId: user.userId,
      authorName,
    });
    // Reopen the latest report so the admin sees it in the pending queue
    await this.reportRepo.reopenLatestByPublicationId(repoId);
    return this.publicationRepo.getReportsHistory(repoId);
  }

  @Put(':repoId/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reactivatePublication(
    @Param('repoId') repoId: string,
    @Body() dto: ReportsHistoryReplyDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const pub = await this.getUseCase.getByRepoId(repoId);
    if (pub.status !== PublicationStatus.SUSPENDED) {
      throw new BadRequestException('Publication is not suspended');
    }

    const contributor = await this.contributorRepo.findByUserId(user.userId);
    const adminName = contributor?.contrInfo.username ?? 'Admin';

    await this.updateUseCase.update(repoId, {
      status: PublicationStatus.ACTIVE,
    });
    await this.publicationRepo.pushReportsHistoryEntry(repoId, {
      action: 'reactivate',
      message: dto.message,
      authorId: user.userId,
      authorName: adminName,
    });
    return this.publicationRepo.getReportsHistory(repoId);
  }
}
