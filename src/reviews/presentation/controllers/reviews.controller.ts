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
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import { Role } from '@/presentation/http/decorators/role.enum';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetReviewUseCase } from '../../application/use-cases/get-review.use-case';
import { UpdateReviewUseCase } from '../../application/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import {
  CreateReviewDto,
  GetAllReviewsQueryDto,
  GetByReleaseQueryDto,
  UpdateReviewDto,
  toReviewResponse,
} from '../../application/dto/review.dto';
import {
  ApiCreate,
  ApiDelete,
  ApiGetAll,
  ApiGetByAuthor,
  ApiGetByRelease,
  ApiUpdate,
} from '../swagger/reviews.swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createUseCase: CreateReviewUseCase,
    private readonly getUseCase: GetReviewUseCase,
    private readonly updateUseCase: UpdateReviewUseCase,
    private readonly deleteUseCase: DeleteReviewUseCase,
  ) {}

  @Get()
  @ApiGetAll()
  async getAll(@Query() query: GetAllReviewsQueryDto) {
    const { data, total } = await this.getUseCase.getAll(
      query.page,
      query.limit,
    );
    const nameMap = await this.getUseCase.resolveAuthorNames(data);
    return {
      data: data.map((r) => toReviewResponse(r, nameMap.get(r.authorId))),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  @Get('author')
  @ApiGetByAuthor()
  async getByAuthor(@Query('authorId') authorId: string) {
    const reviews = await this.getUseCase.getByAuthor(authorId);
    const nameMap = await this.getUseCase.resolveAuthorNames(reviews);
    return reviews.map((r) => toReviewResponse(r, nameMap.get(r.authorId)));
  }

  @Get('release')
  @ApiGetByRelease()
  async getByRelease(@Query() query: GetByReleaseQueryDto) {
    const { data, total } = await this.getUseCase.getByRelease(
      query.repoId,
      query.releaseId,
      query.page,
      query.limit,
    );
    const nameMap = await this.getUseCase.resolveAuthorNames(data);
    return {
      data: data.map((r) => toReviewResponse(r, nameMap.get(r.authorId))),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreate()
  async create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const review = await this.createUseCase.execute({
      repoId: dto.repoId,
      releaseId: dto.releaseId,
      authorId: user.userId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });
    const nameMap = await this.getUseCase.resolveAuthorNames([review]);
    return toReviewResponse(review, nameMap.get(review.authorId));
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiUpdate()
  async update(
    @Query('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const existing = await this.getUseCase.getById(id);
    if (existing.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this review');
    }
    const updated = await this.updateUseCase.execute(id, {
      title: dto.title,
      comment: dto.comment,
      rating: dto.rating,
    });
    const nameMap = await this.getUseCase.resolveAuthorNames([updated]);
    return toReviewResponse(updated, nameMap.get(updated.authorId));
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDelete()
  async delete(@Query('id') id: string, @CurrentUser() user: CurrentUserData) {
    const existing = await this.getUseCase.getById(id);
    if (existing.authorId !== user.userId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You do not own this review');
    }
    await this.deleteUseCase.execute(id);
  }
}
