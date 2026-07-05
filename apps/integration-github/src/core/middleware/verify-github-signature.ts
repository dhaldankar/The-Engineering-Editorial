import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { env } from '../../config/env';

export const verifyGithubSignature = (req: Request, res: Response, next: NextFunction) => {
  const signatureHeader = req.headers['x-hub-signature-256'];
  
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return res.status(401).send('Unauthorized: Missing signature');
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    return res.status(500).send('Internal Server Error: Missing raw body');
  }

  const hmac = crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return res.status(401).send('Unauthorized: Invalid signature');
  }

  next();
};
