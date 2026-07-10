import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { RolesGuard } from '@/presentation/http/guards/roles.guard';
import { Roles } from '@/presentation/http/decorators/roles.decorator';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import { Role } from '@/presentation/http/decorators/role.enum';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
} from '@/contributors/domain/repositories/contributor.repository.interface';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';
import { CreateReportUseCase } from '../../application/use-cases/create-report.use-case';
import { GetReportsUseCase } from '../../application/use-cases/get-reports.use-case';
import { ResolveReportUseCase } from '../../application/use-cases/resolve-report.use-case';
import {
  CreateReportDto,
  GetReportsQueryDto,
  ResolveReportDto,
  toReportResponse,
} from '../../application/dto/report.dto';
import { ApiCreate, ApiGetAll, ApiResolve } from '../swagger/reports.swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly createUseCase: CreateReportUseCase,
    private readonly getUseCase: GetReportsUseCase,
    private readonly resolveUseCase: ResolveReportUseCase,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreate()
  async create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const report = await this.createUseCase.execute({
      publicationId: dto.publicationId,
      reporterId: user.userId,
      reason: dto.reason,
      description: dto.description ?? '',
    });
    return toReportResponse(report);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiGetAll()
  async getFiltered(@Query() query: GetReportsQueryDto) {
    const { data, total } = await this.getUseCase.getFiltered({
      publicationId: query.publicationId,
      status: query.status,
      reason: query.reason,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page,
      limit: query.limit,
    });

    // Resolve publication authors
    const uniquePubIds = [...new Set(data.map((r) => r.publicationId))];
    const pubs = await Promise.all(
      uniquePubIds.map((id) => this.publicationRepo.findByRepoId(id)),
    );
    const pubAuthorMap = new Map<string, string>();
    const pubStatusMap = new Map<string, string>();
    for (const pub of pubs) {
      if (pub) {
        pubAuthorMap.set(pub.repoId, pub.authorId);
        pubStatusMap.set(pub.repoId, pub.status);
      }
    }

    // Batch-resolve reporter and publication author names
    const allUserIds = [
      ...new Set([
        ...data.map((r) => r.reporterId),
        ...Array.from(pubAuthorMap.values()),
      ]),
    ];
    const contributors = await this.contributorRepo.findByUserIds(allUserIds);
    const nameMap = new Map(
      contributors.map((c) => [c.userId, c.contrInfo.username]),
    );

    return {
      data: data.map((r) => {
        const authorId = pubAuthorMap.get(r.publicationId);
        return {
          ...toReportResponse(r),
          reporterName: nameMap.get(r.reporterId),
          publicationAuthorName: authorId ? nameMap.get(authorId) : undefined,
          publicationStatus: pubStatusMap.get(r.publicationId),
        };
      }),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  @Put('resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiResolve()
  async resolve(
    @Query('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const contributor = await this.contributorRepo.findByUserId(user.userId);
    const adminName = contributor?.contrInfo.username ?? 'Admin';

    const report = await this.resolveUseCase.execute({
      id,
      action: dto.action,
      resolvedBy: user.userId,
      resolvedByName: adminName,
      message: dto.message,
    });
    return toReportResponse(report);
  }
}
