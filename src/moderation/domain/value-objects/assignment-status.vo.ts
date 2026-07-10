export enum AssignmentStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export interface ReviewerVerdict {
  isSafe: boolean;
  comment: string | null;
}
