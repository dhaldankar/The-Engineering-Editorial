import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { badRequest } from "../http.js";

export const validateBody = <T, E extends APIGatewayProxyEvent = APIGatewayProxyEvent>(
  schema: z.ZodType<T>,
  handler: (event: E & { parsedBody: T }) => Promise<APIGatewayProxyResult>
) => {
  return async (event: E): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return badRequest("Missing request body");
      }
      
      const jsonBody = JSON.parse(event.body);
      const parsedBody = schema.parse(jsonBody);

      return handler({ ...event, parsedBody });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return badRequest(err.errors);
      }
      return badRequest("Invalid JSON body");
    }
  };
};
