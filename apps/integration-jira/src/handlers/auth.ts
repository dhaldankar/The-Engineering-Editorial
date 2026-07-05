import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createDbClient } from "@engineering-editorial/db-client";
import { contributorOauthTokens } from "@engineering-editorial/db-client/src/schema";
// import { JiraConnector } from "@engineering-editorial/connectors/src/jira";

/**
 * Handles the initial OAuth redirect to Atlassian.
 */
export const authorizeHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // 1. Get the contributor ID from the Cognito authorizer or token in the event
    // const contributorId = event.requestContext.authorizer?.claims?.sub;
    
    // 2. Construct the Atlassian OAuth URL
    const clientId = process.env.ATLASSIAN_CLIENT_ID;
    const redirectUri = process.env.ATLASSIAN_REDIRECT_URI;
    const scopes = "read:jira-work read:jira-user"; // Configure specific scopes here
    const audience = "api.atlassian.com";
    
    // Use the state parameter to pass back the contributorId (encrypt/sign this in production)
    // const state = Buffer.from(JSON.stringify({ contributorId })).toString('base64');
    const state = "dummy-state-for-now";
    
    const authorizeUrl = `https://auth.atlassian.com/authorize?audience=${audience}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri!)}&state=${state}&response_type=code&prompt=consent`;
    
    return {
      statusCode: 302,
      headers: {
        Location: authorizeUrl,
      },
      body: "",
    };
  } catch (error) {
    console.error("Authorize error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

/**
 * Handles the callback from Atlassian with the authorization code.
 */
export const callbackHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing authorization code" }),
      };
    }
    
    // 1. Decode state to find the contributorId
    // const stateData = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
    // const contributorId = stateData.contributorId;
    const contributorId = "dummy-contributor-id"; // Replace with actual parsing
    
    // 2. Exchange code for token
    const tokenResponse = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ATLASSIAN_REDIRECT_URI,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange token: ${await tokenResponse.text()}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // 3. Store tokens in the database
    // In production, encrypt these tokens before storing using a KMS key
    const accessTokenCiphertext = tokenData.access_token; // TODO: encrypt
    const refreshTokenCiphertext = tokenData.refresh_token; // TODO: encrypt
    
    const expiresAt = new Date();
    // Initialize DB client inside lambda (or reuse globally in prod)
    const db = createDbClient({ 
      mode: "data-api", 
      resourceArn: process.env.DB_CLUSTER_ARN || "",
      secretArn: process.env.DB_SECRET_ARN || "",
      database: process.env.DB_NAME || "editorial",
      region: process.env.AWS_REGION || "us-east-1"
    });

    await db.insert(contributorOauthTokens).values({
      id: crypto.randomUUID(), // Assuming Node 19+ or require crypto
      contributorId,
      provider: "atlassian",
      accessTokenCiphertext,
      refreshTokenCiphertext,
      expiresAt,
    }).onConflictDoUpdate({
      target: [contributorOauthTokens.contributorId, contributorOauthTokens.provider],
      set: {
        accessTokenCiphertext,
        refreshTokenCiphertext,
        expiresAt,
        updatedAt: new Date(),
      },
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Jira connected successfully!" }),
    };
  } catch (error) {
    console.error("Callback error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
