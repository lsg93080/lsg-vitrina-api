export const MAIL_SERVICE = 'MAIL_SERVICE';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface IMailService {
  // Fire-and-forget: implementations must catch and log all errors internally.
  send(options: SendEmailOptions): Promise<void>;
}
