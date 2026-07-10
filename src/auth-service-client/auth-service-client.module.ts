import { Module } from '@nestjs/common';
import { AuthServiceClient } from './auth-service.client';

@Module({
  providers: [AuthServiceClient],
  exports: [AuthServiceClient],
})
export class AuthServiceClientModule {}
