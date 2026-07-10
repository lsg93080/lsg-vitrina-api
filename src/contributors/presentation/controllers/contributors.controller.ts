import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../presentation/http/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../../presentation/http/guards/api-key.guard';
import { CurrentUser } from '../../../presentation/http/decorators/current-user.decorator';
import { Role } from '../../../presentation/http/decorators/role.enum';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import { CreateContributorUseCase } from '../../application/use-cases/create-contributor.use-case';
import { GetContributorUseCase } from '../../application/use-cases/get-contributor.use-case';
import { UpdateContributorUseCase } from '../../application/use-cases/update-contributor.use-case';
import {
  CreateContributorDto,
  UpdateContributorDto,
  UpdateStatsDto,
  UpdateContrInfoDto,
} from '../../application/dto/contributor.dto';
import {
  ApiGetAll,
  ApiGetAllActive,
  ApiFind,
  ApiCheck,
  ApiGetTops,
  ApiGetTopRated,
  ApiFilter,
  ApiCreate,
  ApiUpdate,
  ApiUpdateRating,
  ApiUpdateContrInfo,
} from '../swagger/contributors.swagger';

@ApiTags('Contributors')
@Controller('contributors')
export class ContributorsController {
  constructor(
    private readonly createUseCase: CreateContributorUseCase,
    private readonly getUseCase: GetContributorUseCase,
    private readonly updateUseCase: UpdateContributorUseCase,
  ) {}

  @Get()
  @ApiGetAll()
  getAll() {
    return this.getUseCase.getAll();
  }

  @Get('active')
  @ApiGetAllActive()
  getAllActive() {
    return this.getUseCase.getAllActive();
  }

  @Get('find')
  @ApiFind()
  findById(@Query('id') id?: string, @Query('userId') userId?: string) {
    if (userId) return this.getUseCase.getByUserId(userId);
    return this.getUseCase.getById(id!);
  }

  @Get('check')
  @ApiCheck()
  checkExists(@Query('userId') userId: string) {
    return this.getUseCase.checkExists(userId);
  }

  @Get('stats')
  @ApiGetTops()
  getTops(
    @Query('orderBy')
    orderBy: 'postsQty' | 'totalRating' | 'downloads' = 'postsQty',
    @Query('orderMode') orderMode: 'asc' | 'desc' = 'desc',
    @Query('limit') limit = '10',
  ) {
    return this.getUseCase.getTops({
      orderBy,
      orderMode,
      limit: parseInt(limit, 10),
    });
  }

  @Get('stats/top')
  @ApiGetTopRated()
  getTopRated(@Query('threshold') threshold = '3') {
    return this.getUseCase.getTopRated(parseInt(threshold, 10));
  }

  @Get('filter')
  @ApiFilter()
  search(@Query('search') search = '') {
    return this.getUseCase.search(search);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreate()
  create(
    @Body() dto: CreateContributorDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.createUseCase.execute({
      ...dto,
      userId: user.userId,
      email: user.email,
    });
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiUpdate()
  update(
    @Query('userId') userId: string,
    @Body() dto: UpdateContributorDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (userId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this contributor profile');
    }
    return this.updateUseCase.update(userId, dto);
  }

  @Put('rating')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateRating()
  updateRating(@Query('userId') userId: string, @Body() dto: UpdateStatsDto) {
    return this.updateUseCase.updateStats(userId, dto);
  }

  @Put('contrInfo')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateContrInfo()
  updateContrInfo(
    @Query('userId') userId: string,
    @Body() dto: UpdateContrInfoDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (userId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this contributor profile');
    }
    return this.updateUseCase.updateContrInfo(userId, dto);
  }
}
