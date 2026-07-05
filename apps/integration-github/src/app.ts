import express from 'express';
import { verifyGithubSignature } from './core/middleware/verify-github-signature';
import { OauthCallbackHandler } from './handlers/http/oauth-callback-handler';
import { WebhookHandler } from './handlers/http/webhook-handler';
import { GithubOauthAdapter } from './adapters/github-oauth-adapter';
import { InstallationRepository } from './repositories/installation-repository';
import { createDbClient } from '@engineering-editorial/db-client';

const app = express();

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/engineering-editorial';
const db = createDbClient({ mode: 'proxy', connectionString: dbUrl });

const oauthAdapter = new GithubOauthAdapter();
const installationRepo = new InstallationRepository(db);
const oauthCallbackHandler = new OauthCallbackHandler(oauthAdapter, installationRepo);
const webhookHandler = new WebhookHandler();

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.get('/oauth/callback', oauthCallbackHandler.handle);
app.post('/webhook', verifyGithubSignature, webhookHandler.handle);

export { app };
