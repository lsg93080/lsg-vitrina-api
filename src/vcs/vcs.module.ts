import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthServiceClientModule } from '@/auth-service-client/auth-service-client.module';
import {
  PublicationSchemaClass,
  PublicationSchema,
} from '@/publications/infrastructure/schemas/publication.schema';
import { GitLabClient } from './gitlab-client';
import { GitHubClient } from './github-client';
import { VcsService } from './vcs.service';
import { VcsController } from './vcs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicationSchemaClass.name, schema: PublicationSchema },
    ]),
    AuthServiceClientModule,
  ],
  providers: [GitLabClient, GitHubClient, VcsService],
  controllers: [VcsController],
})
export class VcsModule {}
