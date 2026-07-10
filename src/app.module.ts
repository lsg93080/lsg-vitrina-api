import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthServiceClientModule } from './auth-service-client/auth-service-client.module';
import { VcsModule } from './vcs/vcs.module';
import { ContributorsModule } from './contributors/contributors.module';
import { PublicationsModule } from './publications/publications.module';
import { PublicationDetailsModule } from './publication-details/publication-details.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './common/mail/mail.module';
import { ModerationModule } from './moderation/moderation.module';
import { JwtStrategy } from '@/presentation/http/strategies/jwt.strategy';
import { AppController } from '@/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),

    AuthServiceClientModule,
    VcsModule,
    ContributorsModule,
    PublicationsModule,
    PublicationDetailsModule,
    ReviewsModule,
    ReportsModule,
    MailModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy],
})
export class AppModule {}
