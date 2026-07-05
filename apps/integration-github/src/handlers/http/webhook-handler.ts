import { Request, Response } from 'express';

export class WebhookHandler {
  handle = async (req: Request, res: Response) => {
    const eventType = req.headers['x-github-event'];
    
    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).send('Bad Request: Missing event type');
    }

    try {
      const payload = req.body;
      
      // Process payload depending on eventType
      console.log(`Received GitHub Webhook Event: ${eventType}`);
      
      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  };
}
