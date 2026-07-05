#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CoreStack } from '../lib/core-stack';
import { getConfig } from '../lib/config';

const app = new cdk.App();

// Load configuration based on context
const config = getConfig(app);

// 1. Deploy the foundational persistent resources
const coreStack = new CoreStack(app, `SahayakCoreStack-${config.environment}`, {
  config,
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});

// Future Stacks (Phase 6):
// const apiStack = new ApiStack(app, `SahayakApiStack-${config.environment}`, {
//   vpc: coreStack.vpc,
//   proxy: coreStack.proxy,
//   userPool: coreStack.userPool,
// });

app.synth();
