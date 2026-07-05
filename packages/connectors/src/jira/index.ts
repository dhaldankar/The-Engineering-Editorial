export class JiraConnector {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // remove trailing slash
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/rest/api/3${endpoint}`;
    
    // Implement simple backoff for 429s
    let retries = 3;
    let delay = 1000;
    
    while (retries > 0) {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
      });

      if (response.status === 429) {
        retries--;
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
        
        if (retries === 0) {
          throw new Error(`Jira API Rate Limit Exceeded: ${url}`);
        }
        
        await new Promise(res => setTimeout(res, waitTime));
        delay *= 2; // exponential backoff
        continue;
      }

      if (!response.ok) {
        throw new Error(`Jira API Error ${response.status}: ${await response.text()}`);
      }

      return response.json();
    }
  }

  /**
   * Execute a JQL search with pagination support.
   */
  async searchIssues(jql: string, startAt: number = 0, maxResults: number = 50) {
    return this.request(`/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}`);
  }
}
