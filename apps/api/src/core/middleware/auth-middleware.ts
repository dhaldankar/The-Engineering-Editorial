import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../../config/env.js";
import { unauthorized } from "../http.js";

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID || null,
});

export type AuthenticatedEvent = APIGatewayProxyEvent & {
  tenantId: string;
};

export const withAuth = (
  handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized();
    }

    const token = authHeader.substring(7);
    try {
      const payload = await verifier.verify(token);
      // Assume the claim is named 'custom:product_id'
      const tenantId = (payload as any)["custom:product_id"];
      if (!tenantId) {
        return unauthorized();
      }

      return handler({ ...event, tenantId });
    } catch (err) {
      console.error("Token verification failed:", err);
      return unauthorized();
    }
  };
};
