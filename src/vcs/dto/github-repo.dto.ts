import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GitHubRepoNamespaceDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Owner login (e.g. "johndoe")' })
  name: string;

  @ApiProperty({ description: 'URL-friendly owner slug (e.g. "johndoe")' })
  path: string;

  @ApiProperty({ enum: ['user', 'organization'] })
  kind: 'user' | 'organization';

  @ApiProperty()
  webUrl: string;
}

export class GitHubRepoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Full name including owner (e.g. "johndoe/my-game")',
  })
  nameWithNamespace: string;

  @ApiProperty({ description: 'URL-friendly repo slug (e.g. "my-game")' })
  path: string;

  @ApiProperty({
    description: 'Full path including owner (e.g. "johndoe/my-game")',
  })
  pathWithNamespace: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  webUrl: string;

  @ApiProperty({ enum: ['public', 'private'] })
  visibility: 'public' | 'private';

  @ApiProperty()
  defaultBranch: string;

  @ApiProperty({ type: [String] })
  topics: string[];

  @ApiProperty()
  lastActivityAt: string;

  @ApiProperty({ type: GitHubRepoNamespaceDto })
  namespace: GitHubRepoNamespaceDto;
}

export class GitHubRepoMetadataDto {
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

  @ApiProperty({ enum: ['public', 'private'] })
  visibility: 'public' | 'private';
}
