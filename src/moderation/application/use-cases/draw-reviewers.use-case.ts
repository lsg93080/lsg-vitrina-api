import { Injectable, Inject } from '@nestjs/common';
import {
  REVIEWER_ASSIGNMENT_REPOSITORY,
  type IReviewerAssignmentRepository,
} from '../../domain/repositories/reviewer-assignment.repository.interface';
import {
  CONTRIBUTOR_REPOSITORY,
  type IContributorRepository,
} from '../../../contributors/domain/repositories/contributor.repository.interface';
import {
  PUBLICATION_DETAILS_REPOSITORY,
  type IPublicationDetailsRepository,
} from '../../../publication-details/domain/repositories/publication-details.repository.interface';
import {
  MAIL_SERVICE,
  type IMailService,
} from '../../../common/mail/mail.service.interface';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';

export interface DrawReviewersInput {
  publicationRepoId: string;
  publicationTitle: string;
  authorUserId: string;
  hasReleases: boolean;
}

@Injectable()
export class DrawReviewersUseCase {
  constructor(
    @Inject(REVIEWER_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IReviewerAssignmentRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly detailsRepo: IPublicationDetailsRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}

  async execute(input: DrawReviewersInput): Promise<void> {
    try {
      const count = parseInt(
        process.env.MODERATION_REVIEWERS_PER_PUB ?? '5',
        10,
      );
      const baseUrl = process.env.VITRINA_BASE_URL ?? 'http://localhost:3007';

      const pool = await this.contributorRepo.findReviewerPool(
        input.authorUserId,
      );
      if (pool.length === 0) return;

      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const selected = pool.slice(0, count);

      const now = new Date();
      const assignments = await Promise.all(
        selected.map((reviewer) =>
          this.assignmentRepo.create(
            new ReviewerAssignment(
              undefined,
              input.publicationRepoId,
              reviewer.userId,
              reviewer.email,
              AssignmentStatus.PENDING,
              null,
              now,
              null,
            ),
          ),
        ),
      );

      void this.detailsRepo.update(input.publicationRepoId, {
        reviewers: assignments.map((a) => a.reviewerId),
      });

      for (const assignment of assignments) {
        const pubUrl = `${baseUrl}/#/store/publications/details?repoId=${input.publicationRepoId}`;
        const settingsUrl = `${baseUrl}/#/settings`;
        const subject = `[LifeSync-Games] You have been selected as a reviewer`;
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">


                  <!-- Header -->
                  <tr>
                    <td style="background:#fa5e15;padding:28px 40px;text-align:center;">
                      <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">
                        LifeSync-Games
                      </p>
                      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">
                        Reviewer Notification
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px;">
                      <p style="margin:0 0 16px;font-size:15px;color:#cccccc;">Hi,</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#cccccc;line-height:1.6;">
                        You have been selected as a reviewer for the publication:
                      </p>

                      <!-- Publication title card -->
                      <div style="background:#1f1f1f;border-left:4px solid #fa5e15;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
                        <p style="margin:0;font-size:17px;font-weight:bold;color:#ffffff;">
                          ${input.publicationTitle}
                        </p>
                      </div>

                      <p style="margin:0 0 24px;font-size:15px;color:#cccccc;line-height:1.6;">
                        To review it, log in and go to <strong style="color:#ffffff;">Dashboard &gt; My Moderations</strong>.
                      </p>

                      <!-- CTA button -->
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="background:#fa5e15;border-radius:6px;">
                            <a href="${pubUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                              View Publication
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;font-size:15px;color:#cccccc;line-height:1.6;">
                        Thank you for being part of the LifeSync-Games moderation community.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#111111;padding:20px 40px;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;font-size:12px;color:#666666;line-height:1.7;">
                        You received this email because you are registered as a reviewer on LifeSync-Games.<br>
                        If you no longer wish to receive these notifications, log in and disable the reviewer option in
                        <a href="${settingsUrl}" style="color:#fa5e15;text-decoration:none;">Settings</a>.
                      </p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `;
        void this.mailService.send({
          to: assignment.reviewerEmail,
          subject,
          html,
        });
      }
    } catch (error) {
      console.error('[DrawReviewers]', error);
    }
  }
}
