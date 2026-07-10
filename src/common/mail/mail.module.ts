import { Module } from '@nestjs/common';
import { MAIL_SERVICE } from './mail.service.interface';
import { ResendMailService } from './mail.service';

@Module({
  providers: [{ provide: MAIL_SERVICE, useClass: ResendMailService }],
  exports: [MAIL_SERVICE],
})
export class MailModule {}
