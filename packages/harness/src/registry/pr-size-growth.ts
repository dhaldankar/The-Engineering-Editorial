import { defineMetric } from "../types";
import { sql } from "drizzle-orm";

export const prSizeGrowth = defineMetric({
  name: "pr_size_growth",
  version: 1,
  tier: "aggregate",
  grain: ["repo", "pr", "period"],
  reads: ["github_prs", "pr_files"],
  compute: async (ctx) => {
    // A sample SQL template using drizzle-orm sql tags
    return sql`
      SELECT 
        ${ctx.repoId} as repo,
        p.id as pr,
        date_trunc('week', p.created_at) as period,
        SUM(f.additions + f.deletions) as value_num
      FROM core.github_prs p
      JOIN core.pr_files f ON p.id = f.pr_id
      WHERE p.repo_id = ${ctx.repoId}
      GROUP BY p.id, period
    `;
  },
});
