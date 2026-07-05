import { Octokit } from "@octokit/rest";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { retry } from "@octokit/plugin-retry";

// Setup Octokit with built-in pagination and retry backoff
const MyOctokit = Octokit.plugin(paginateRest, retry);

export class GithubConnector {
  private client: InstanceType<typeof MyOctokit>;

  constructor(token: string) {
    this.client = new MyOctokit({
      auth: token,
    });
  }

  /**
   * Fetches all pull requests for a given repository.
   * Leverages the paginate plugin to handle API limits.
   */
  async fetchPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "all") {
    return (this.client as any).paginate((this.client as any).rest.pulls.list, {
      owner,
      repo,
      state,
      per_page: 100,
    });
  }

  /**
   * Fetches review comments for a specific PR.
   */
  async fetchReviewComments(owner: string, repo: string, pullNumber: number) {
    return (this.client as any).paginate((this.client as any).rest.pulls.listReviewComments, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });
  }

  // Get instance for custom requests
  getInstance(): any {
    return this.client;
  }
}
