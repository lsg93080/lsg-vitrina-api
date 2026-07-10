import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '@/presentation/http/decorators/current-user.decorator';
import type { CurrentUserData } from '@/presentation/http/types/authenticated-request.interface';
import { VcsService } from './vcs.service';
import { GitLabRepoDto, GitLabRepoMetadataDto } from './dto/gitlab-repo.dto';
import { GitHubRepoDto, GitHubRepoMetadataDto } from './dto/github-repo.dto';
import { CanDisconnectResponseDto } from './dto/can-disconnect.dto';

@ApiTags('VCS')
@ApiBearerAuth()
@Controller('vcs')
export class VcsController {
  constructor(private readonly vcsService: VcsService) {}

  @Get('gitlab/repos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List GitLab repositories for the authenticated user',
  })
  @ApiResponse({ status: 200, type: [GitLabRepoDto] })
  @ApiResponse({ status: 404, description: 'GitLab account not connected' })
  async getGitLabRepos(
    @CurrentUser() user: CurrentUserData,
  ): Promise<GitLabRepoDto[]> {
    return this.vcsService.getGitLabRepos(user.userId);
  }

  @Get('gitlab/repos/:repoId/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get GitLab repository metadata including README' })
  @ApiParam({ name: 'repoId', type: Number })
  @ApiResponse({ status: 200, type: GitLabRepoMetadataDto })
  @ApiResponse({
    status: 404,
    description: 'Repo not found or GitLab not connected',
  })
  async getRepoMetadata(
    @CurrentUser() user: CurrentUserData,
    @Param('repoId', ParseIntPipe) repoId: number,
  ): Promise<GitLabRepoMetadataDto> {
    return this.vcsService.getGitLabRepoMetadata(user.userId, repoId);
  }

  @Get('github/repos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List GitHub repositories for the authenticated user',
  })
  @ApiResponse({ status: 200, type: [GitHubRepoDto] })
  @ApiResponse({ status: 404, description: 'GitHub account not connected' })
  async getGitHubRepos(
    @CurrentUser() user: CurrentUserData,
  ): Promise<GitHubRepoDto[]> {
    return this.vcsService.getGitHubRepos(user.userId);
  }

  @Get('github/repos/:repoId/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get GitHub repository metadata including README' })
  @ApiParam({ name: 'repoId', type: Number })
  @ApiResponse({ status: 200, type: GitHubRepoMetadataDto })
  @ApiResponse({
    status: 404,
    description: 'Repo not found or GitHub not connected',
  })
  async getGitHubRepoMetadata(
    @CurrentUser() user: CurrentUserData,
    @Param('repoId', ParseIntPipe) repoId: number,
  ): Promise<GitHubRepoMetadataDto> {
    return this.vcsService.getGitHubRepoMetadata(user.userId, repoId);
  }

  @Get('can-disconnect/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if the user can disconnect a VCS provider' })
  @ApiParam({ name: 'provider', enum: ['gitlab', 'github'] })
  @ApiResponse({ status: 200, type: CanDisconnectResponseDto })
  async canDisconnect(
    @CurrentUser() user: CurrentUserData,
    @Param('provider') provider: string,
  ): Promise<CanDisconnectResponseDto> {
    return this.vcsService.canDisconnect(user.userId, provider);
  }
}
