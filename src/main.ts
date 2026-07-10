import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from '@/presentation/http/filters/all-exceptions.filter';

let port: number;
const globalPrefix = 'v1';

function validateEnvironment(): void {
  port = parseInt(process.env.PORT ?? '3020', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      '.env file: PORT must be a valid number between 1 and 65535',
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('.env file: MONGODB_URI is not defined');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('.env file: JWT_SECRET is not defined');
  }
  if (!process.env.VITRINA_API_KEY) {
    throw new Error('.env file: VITRINA_API_KEY is not defined');
  }
}

function logStartup(): void {
  const logger = new Logger('Bootstrap');
  logger.verbose(`Application is running on port ${port}`);
  logger.verbose(
    `MongoDB URI: ${process.env.MONGODB_URI!.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`,
  );
  logger.verbose(
    `Swagger docs available at: /vitrina/api/${globalPrefix}/docs`,
  );
}

async function bootstrap(): Promise<void> {
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'VitrinaAPI',
    }),
  });

  app.setGlobalPrefix(globalPrefix);

  // Security headers middleware
  app.use(helmet());

  // Enable CORS: origins configurable via CORS_ORIGINS (comma-separated, 12-Factor)
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3007'];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'x-api-key', 'Accept'],
    credentials: true,
  });

  // Global exception filter (prevents stack trace leaks in production)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger configuration (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Vitrina Service API')
      .setDescription(
        'Publication showcase and social regulation platform for LifeSync Games framework.',
      )
      .setVersion('1.0')
      .addServer(`/${globalPrefix}`)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'JWT token from Auth Service /auth/api/v1/login',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description:
            'API key for internal service-to-service calls (VITRINA_API_KEY)',
        },
        'API-key',
      )
      .addTag('Contributors', 'Contributor profiles and stats')
      .addTag('Publications', 'Publication catalog')
      .addTag('Publication Details', 'Publication details and releases')
      .addTag('Reviews', 'User reviews and ratings')
      .addTag('Reports', 'Content reports for admin moderation')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
      ignoreGlobalPrefix: true,
    });

    // Swagger served at /vitrina/api/v1/docs via Nginx strip of /vitrina/api/
    SwaggerModule.setup(globalPrefix + '/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Vitrina Service API Docs',
    });
  }

  await app.listen(port);
  logStartup();
}

bootstrap().catch((err) => {
  console.error(
    `Bootstrap error: ${err instanceof Error ? err.message : 'Unknown error'}`,
  );
  process.exit(1);
});
