import * as cdk from 'aws-cdk-lib';

export interface AppConfig {
  environment: string;
  database: {
    maxCapacity: number;
    minCapacity: number;
  };
}

export function getConfig(app: cdk.App): AppConfig {
  const env = app.node.tryGetContext('env') || 'dev';
  
  const envConfig = app.node.tryGetContext(env);
  if (!envConfig) {
    throw new Error(`Context configuration for environment '${env}' not found.`);
  }

  return {
    environment: env,
    database: {
      maxCapacity: envConfig.database?.maxCapacity || 2,
      minCapacity: envConfig.database?.minCapacity || 0.5,
    },
  };
}
