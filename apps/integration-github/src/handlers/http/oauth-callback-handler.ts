import { Request, Response } from 'express';
import { GithubOauthAdapter } from '../../adapters/github-oauth-adapter';
import { InstallationRepository } from '../../repositories/installation-repository';

export class OauthCallbackHandler {
  constructor(
    private oauthAdapter: GithubOauthAdapter,
    private installationRepo: InstallationRepository
  ) {}

  handle = async (req: Request, res: Response) => {
    try {
      const code = req.query.code;
      const state = req.query.state;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Bad Request: Missing code');
      }
      if (!state || typeof state !== 'string') {
        return res.status(400).send('Bad Request: Missing state (productId)');
      }

      const productId = state;

      const token = await this.oauthAdapter.exchangeCodeForToken(code);
      await this.installationRepo.saveInstallationToken(productId, token);

      res.redirect('/integration/success');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  };
}
