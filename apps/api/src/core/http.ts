import { APIGatewayProxyResult } from "aws-lambda";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

export const ok = (body: any): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const accepted = (body: any): APIGatewayProxyResult => ({
  statusCode: 202,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const badRequest = (error: any): APIGatewayProxyResult => ({
  statusCode: 400,
  headers: corsHeaders,
  body: JSON.stringify({ error }),
});

export const unauthorized = (): APIGatewayProxyResult => ({
  statusCode: 401,
  headers: corsHeaders,
  body: JSON.stringify({ error: "Unauthorized" }),
});

export const serverError = (error: any): APIGatewayProxyResult => ({
  statusCode: 500,
  headers: corsHeaders,
  body: JSON.stringify({ error: "Internal Server Error", details: String(error) }),
});
