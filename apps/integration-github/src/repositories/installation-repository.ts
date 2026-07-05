import { dataConnectors } from '@engineering-editorial/db-client';
import * as crypto from 'crypto';
import { env } from '../config/env';

export class InstallationRepository {
  constructor(private db: any) {}

  async saveInstallationToken(productId: string, token: string): Promise<void> {
    const key = Buffer.from(env.ENCRYPTION_KEY_V1, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    const ciphertext = `${iv.toString('hex')}:${authTag}:${encrypted}`;

    await this.db.insert(dataConnectors).values({
      id: crypto.randomUUID(),
      productId,
      connectorType: 'github',
      credentialsCiphertext: ciphertext,
      keyVersion: 1,
    });
  }
}
