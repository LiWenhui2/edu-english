import { randomBytes } from 'crypto';

export function generateRandomToken(length = 32): string {
  return randomBytes(length).toString('hex');
}
