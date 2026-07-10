import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GitLabRepoNamespaceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  path: string;

  @ApiProperty({ enum: ['user', 'group'] })
  kind: 'user' | 'group';

  @ApiProperty()
  webUrl: string;
}

export class GitLabRepoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nameWithNamespace: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  pathWithNamespace: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  webUrl: string;

  @ApiProperty({ enum: ['public', 'private', 'internal'] })
  visibility: 'public' | 'private' | 'internal';

  @ApiProperty()
  defaultBranch: string;

  @ApiProperty({ type: [String] })
  topics: string[];

  @ApiProperty()
  lastActivityAt: string;

  @ApiProperty({ type: GitLabRepoNamespaceDto })
  namespace: GitLabRepoNamespaceDto;
}

export class GitLabRepoMetadataDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  readme: string | null;

  @ApiProperty({ type: [String] })
  topics: string[];

  @ApiProperty()
  webUrl: string;

  @ApiProperty()
  defaultBranch: string;

  @ApiProperty({ enum: ['public', 'private', 'internal'] })
  visibility: 'public' | 'private' | 'internal';
}
