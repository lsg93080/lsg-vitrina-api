import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { IMailService, SendEmailOptions } from './mail.service.interface';

@Injectable()
export class ResendMailService implements IMailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from =
    process.env.EMAIL_FROM ?? 'LifeSync-Games <noreply@lifesyncgames.com>';

  async send(options: SendEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    if (error) {
      console.error(
        `[MailService] Failed to send email to ${options.to}: ${error.message}`,
      );
    }
  }
}
