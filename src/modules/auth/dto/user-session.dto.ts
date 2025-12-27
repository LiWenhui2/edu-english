export class UserSessionDto {
  readonly id?: bigint;
  readonly userId: bigint;
  readonly refreshTokenHash: string;
  readonly refreshExpiresAt: Date;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly createAt?: Date | null;
  readonly rotatedAt?: Date | null;
}
