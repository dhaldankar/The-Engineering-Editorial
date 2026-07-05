import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { AppConfig } from './config';

interface CoreStackProps extends cdk.StackProps {
  config: AppConfig;
}

export class CoreStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly cluster: rds.DatabaseCluster;
  public readonly proxy: rds.DatabaseProxy;
  public readonly userPool: cognito.UserPool;
  public readonly bronzeBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CoreStackProps) {
    super(scope, id, props);

    // 1. VPC with private subnets
    this.vpc = new ec2.Vpc(this, 'CoreVpc', {
      maxAzs: 2,
      natGateways: 1, // Minimize cost for dev
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // 2. Aurora Serverless v2 PostgreSQL
    this.cluster = new rds.DatabaseCluster(this, 'CoreCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: props.config.database.minCapacity,
      serverlessV2MaxCapacity: props.config.database.maxCapacity,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // DB in isolated subnets
      },
      enableDataApi: true,
      defaultDatabaseName: 'insights',
    });

    // 3. RDS Proxy for Lambda connection pooling
    this.proxy = new rds.DatabaseProxy(this, 'CoreProxy', {
      proxyTarget: rds.ProxyTarget.fromCluster(this.cluster),
      secrets: [this.cluster.secret!],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [
        new ec2.SecurityGroup(this, 'ProxySecurityGroup', {
          vpc: this.vpc,
        }),
      ],
      requireTLS: false, // For ease of setup; set to true in production
    });

    // Allow proxy to connect to the cluster
    this.cluster.connections.allowFrom(this.proxy, ec2.Port.tcp(5432), 'Allow proxy access');

    // 4. Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'CoreUserPool', {
      userPoolName: `insights-pool-${props.config.environment}`,
      selfSignUpEnabled: false, // Managed B2B signups
      signInAliases: { email: true },
      autoVerify: { email: true },
    });

    // 5. Bronze Data Lake S3 Bucket
    this.bronzeBucket = new s3.Bucket(this, 'BronzeBucket', {
      bucketName: `insights-bronze-${props.config.environment}-${this.account}-${this.region}`,
      removalPolicy: props.config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.config.environment !== 'prod',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'ClusterEndpoint', { value: this.cluster.clusterEndpoint.socketAddress });
    new cdk.CfnOutput(this, 'ProxyEndpoint', { value: this.proxy.endpoint });
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'BronzeBucketName', { value: this.bronzeBucket.bucketName });
  }
}
