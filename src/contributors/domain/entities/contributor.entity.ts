import { Platform } from '../value-objects/platform.enum';
import { SocialPlatform } from '../value-objects/social-platform.enum';

// Contributor profile stats updated automatically as reviews and publications accumulate.
export interface ContrInfo {
  readonly username: string;
  readonly imgUrl: string;
  readonly bio: string;
  readonly postsQty: number;
  readonly videogamesQty: number;
  readonly extensionsQty: number;
  readonly lastPost: Date | null;
  readonly totalComments: number;
  readonly totalRating: number;
  readonly downloads: number;
  // Social links keyed by SocialPlatform enum, all optional, stored as empty string when absent.
  readonly socials: Partial<Record<SocialPlatform, string>>;
}

export class Contributor {
  constructor(
    readonly id: string | undefined,
    // UUID from Auth Service (sub claim in JWT)
    readonly userId: string,
    readonly email: string,
    // User opted into the reviewer pool for social moderation draws
    readonly isReviewer: boolean,
    readonly platforms: Platform[],
    readonly contrInfo: ContrInfo,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  get isActive(): boolean {
    return this.contrInfo.postsQty > 0;
  }
}
