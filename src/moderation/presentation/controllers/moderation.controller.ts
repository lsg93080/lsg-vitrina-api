import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { RolesGuard } from '@/presentation/http/guards/roles.guard';
import { Roles } from '@/presentation/http/decorators/roles.decorator';
import { Role } from '@/presentation/http/decorators/role.enum';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import { GetAssignmentsUseCase } from '../../application/use-cases/get-assignments.use-case';
import { SubmitVerdictUseCase } from '../../application/use-cases/submit-verdict.use-case';
import {
  AssignmentQueryDto,
  SubmitVerdictDto,
} from '../../application/dto/moderation.dto';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import {
  ApiGetAllAssignments,
  ApiGetMyAssignments,
  ApiGetMyAssignmentsHistory,
  ApiSubmitVerdict,
} from '../swagger/moderation.swagger';

@ApiTags('Moderation')
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly getAssignments: GetAssignmentsUseCase,
    private readonly submitVerdict: SubmitVerdictUseCase,
  ) {}

  @Get('my-assignments')
  @UseGuards(JwtAuthGuard)
  @ApiGetMyAssignments()
  async getMyAssignments(
    @Query() query: AssignmentQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.getAssignments.execute({
      reviewerId: user.userId,
      publicationRepoId: query.publicationRepoId,
      status: AssignmentStatus.PENDING,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    });
  }

  @Get('my-assignments/history')
  @UseGuards(JwtAuthGuard)
  @ApiGetMyAssignmentsHistory()
  async getMyAssignmentsHistory(
    @Query() query: AssignmentQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.getAssignments.execute({
      reviewerId: user.userId,
      status: AssignmentStatus.DONE,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Post('assignments/:id/verdict')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSubmitVerdict()
  async submitAssignmentVerdict(
    @Param('id') id: string,
    @Body() body: SubmitVerdictDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.submitVerdict.execute({
      assignmentId: id,
      reviewerId: user.userId,
      isSafe: body.isSafe,
      comment: body.comment ?? null,
    });
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiGetAllAssignments()
  async getAllAssignments(@Query() query: AssignmentQueryDto) {
    return this.getAssignments.execute({
      publicationRepoId: query.publicationRepoId,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
