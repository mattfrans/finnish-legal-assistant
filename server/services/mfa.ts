import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export class MFAService {
  // Generate TOTP secret and QR code
  async setupTOTP(userId: number) {
    const secret = speakeasy.generateSecret({
      name: 'Finnish Legal Platform',
      length: 20
    });

    // Store the secret in the database
    await db.update(users)
      .set({
        mfaSecret: secret.base32,
        mfaMethod: 'totp',
        mfaEnabled: true
      })
      .where(eq(users.id, userId));

    // Generate QR code for easy setup
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex')
    );

    await db.update(users)
      .set({ backupCodes })
      .where(eq(users.id, userId));

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes
    };
  }

  // Verify TOTP token
  async verifyTOTP(userId: number, token: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.mfaSecret) {
      throw new Error('MFA not set up for this user');
    }

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow for 30 seconds time skew
    });
  }

  // Verify backup code
  async verifyBackupCode(userId: number, code: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.backupCodes) {
      return false;
    }

    const backupCodes = user.backupCodes as string[];
    const codeIndex = backupCodes.indexOf(code);
    
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = [...backupCodes];
    updatedCodes.splice(codeIndex, 1);

    await db.update(users)
      .set({ backupCodes: updatedCodes })
      .where(eq(users.id, userId));

    return true;
  }

  // Disable MFA
  async disableMFA(userId: number) {
    await db.update(users)
      .set({
        mfaEnabled: false,
        mfaMethod: 'none',
        mfaSecret: null,
        backupCodes: []
      })
      .where(eq(users.id, userId));
  }
}
