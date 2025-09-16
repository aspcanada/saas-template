// CDK infrastructure definitions
// This file will contain AWS CDK v2 stack definitions

import { Stack, StackProps, RemovalPolicy, CfnOutput, Duration } from "aws-cdk-lib";
import { Table, BillingMode, AttributeType, TableEncryption } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, BlockPublicAccess, BucketEncryption, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { HttpApi, HttpMethod, CorsHttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CloudFrontWebDistribution, OriginAccessIdentity, CloudFrontAllowedMethods, CloudFrontAllowedCachedMethods, PriceClass } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export class CoreStack extends Stack {
  public readonly table: Table;
  public readonly bucket: Bucket;
  public readonly webHostingBucket: Bucket;
  public readonly cloudFrontDistribution: CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB table with on-demand billing (free tier optimized)
    this.table = new Table(this, "CoreTable", {
      tableName: process.env.DYNAMO_TABLE_NAME || "saas-template-core",
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK", 
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: false, // Disabled for free tier optimization
    });

    // GSI1: subject → notes
    // Partition: "GSI1PK" = `ORG#<orgId>#SUBJECT#<subjectId>`
    // Sort: "GSI1SK" = `NOTE#<noteId>#<createdAtISO>`
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },
    });

    // GSI2: user → notes
    // Partition: "GSI2PK" = `ORG#<orgId>#USER#<userId>`
    // Sort: "GSI2SK" = `NOTE#<noteId>#<createdAtISO>`
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "GSI2PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: AttributeType.STRING,
      },
    });

    // GSI3: role/indexing (optional for future admin listings)
    // Partition: "GSI3PK"
    // Sort: "GSI3SK"
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: {
        name: "GSI3PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI3SK",
        type: AttributeType.STRING,
      },
    });

    // S3 bucket for attachments (free tier optimized)
    this.bucket = new Bucket(this, "AttachmentsBucket", {
      bucketName: `saas-template-attachments-${this.account}-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: false, // Versioning disabled for free tier optimization
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // S3 bucket for web hosting
    this.webHostingBucket = new Bucket(this, "WebHostingBucket", {
      bucketName: `saas-template-web-${this.account}-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // SPA routing
    });

    // CloudFront distribution for web hosting
    const originAccessIdentity = new OriginAccessIdentity(this, "WebOriginAccessIdentity", {
      comment: "Access identity for web hosting bucket"
    });

    this.webHostingBucket.grantRead(originAccessIdentity);

    this.cloudFrontDistribution = new CloudFrontWebDistribution(this, "WebDistribution", {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: this.webHostingBucket,
          originAccessIdentity: originAccessIdentity
        },
        behaviors: [{
          isDefaultBehavior: true,
          allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
          compress: true,
          defaultTtl: Duration.days(1),
          maxTtl: Duration.days(7),
          minTtl: Duration.seconds(0),
        }, {
          // Static assets - cache longer
          pathPattern: "static/*",
          allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
          defaultTtl: Duration.days(30),
          maxTtl: Duration.days(365),
          minTtl: Duration.seconds(0),
        }, {
          // API routes - no caching
          pathPattern: "api/*",
          allowedMethods: CloudFrontAllowedMethods.ALL,
          cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
          defaultTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(0),
          minTtl: Duration.seconds(0),
        }]
      }],
      errorConfigurations: [{
        errorCode: 404,
        responseCode: 200,
        responsePagePath: "/index.html"
      }, {
        errorCode: 403,
        responseCode: 200,
        responsePagePath: "/index.html"
      }],
      comment: "SaaS Template Web Distribution",
      priceClass: PriceClass.PRICE_CLASS_100, // Use only North America and Europe for cost optimization
    });

    // Outputs
    new CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB table name",
    });

    new CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      description: "S3 bucket name for attachments",
    });

    new CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS region",
    });

    new CfnOutput(this, "WebHostingBucketName", {
      value: this.webHostingBucket.bucketName,
      description: "S3 bucket name for web hosting",
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: this.cloudFrontDistribution.distributionId,
      description: "CloudFront distribution ID",
    });

    new CfnOutput(this, "CloudFrontDomainName", {
      value: this.cloudFrontDistribution.distributionDomainName,
      description: "CloudFront distribution domain name",
    });
  }
}

export interface ApiStackProps extends StackProps {
  coreStack: CoreStack;
}

export class ApiStack extends Stack {
  public readonly httpApi: HttpApi;
  private notesListFunction: NodejsFunction;
  private notesGetFunction: NodejsFunction;
  private billingCheckoutFunction: NodejsFunction;
  private billingPortalFunction: NodejsFunction;
  private billingEntitlementFunction: NodejsFunction;
  private billingWebhookFunction: NodejsFunction;
  private attachmentsPresignFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create HTTP API with CORS
    this.httpApi = new HttpApi(this, "SaasTemplateApi", {
      description: "SaaS Template API Gateway",
      corsPreflight: {
        allowOrigins: ["*"], // For dev - should be restricted in production
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: Duration.days(1),
      },
    });

    // Notes Lambda functions
    this.notesListFunction = this.createLambdaFunction("NotesList", "notes/list");
    this.notesGetFunction = this.createLambdaFunction("NotesGet", "notes/get");

    // Billing Lambda functions
    this.billingCheckoutFunction = this.createLambdaFunction("BillingCheckout", "billing/checkout");
    this.billingPortalFunction = this.createLambdaFunction("BillingPortal", "billing/portal");
    this.billingEntitlementFunction = this.createLambdaFunction("BillingEntitlement", "billing/entitlement");
    this.billingWebhookFunction = this.createLambdaFunction("BillingWebhook", "billing/webhook");

    // Attachments Lambda function
    this.attachmentsPresignFunction = this.createLambdaFunction("AttachmentsPresign", "attachments/presign");

    // Grant permissions to all Lambda functions
    const lambdaFunctions = [
      this.notesListFunction,
      this.notesGetFunction,
      this.billingCheckoutFunction,
      this.billingPortalFunction,
      this.billingEntitlementFunction,
      this.billingWebhookFunction,
      this.attachmentsPresignFunction,
    ];

    this.grantPermissions(lambdaFunctions, props.coreStack);

    // Add routes to API Gateway
    this.addRoutes();

    // Outputs
    new CfnOutput(this, "ApiUrl", {
      value: this.httpApi.url!,
      description: "API Gateway URL",
    });
  }

  private createLambdaFunction(name: string, handler: string): NodejsFunction {
    const lambdaFunction = new NodejsFunction(this, name, {
      runtime: Runtime.NODEJS_22_X,
      entry: "../apps/api/src/lambda.ts",
      handler: handler,
      environment: {
        NODE_ENV: "production",
        DYNAMO_TABLE_NAME: process.env.DYNAMO_TABLE_NAME || "saas-template-core",
        BUCKET_NAME: process.env.BUCKET_NAME || "",
      },
      bundling: {
        externalModules: ["aws-sdk"],
        nodeModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
      },
      logRetention: RetentionDays.ONE_WEEK, // 7 days retention for free tier optimization
    });

    // Create explicit log group with 7-day retention
    new LogGroup(this, `${name}LogGroup`, {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    return lambdaFunction;
  }

  private grantPermissions(functions: NodejsFunction[], coreStack: CoreStack): void {
    // DynamoDB permissions
    const dynamoPolicy = new PolicyStatement({
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
      ],
      resources: [coreStack.table.tableArn, `${coreStack.table.tableArn}/index/*`],
    });

    // S3 permissions
    const s3Policy = new PolicyStatement({
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
      ],
      resources: [`${coreStack.bucket.bucketArn}/*`],
    });

    // Grant permissions to all functions
    functions.forEach(func => {
      func.addToRolePolicy(dynamoPolicy);
      func.addToRolePolicy(s3Policy);
    });
  }

  private addRoutes(): void {
    // Notes routes
    this.httpApi.addRoutes({
      path: "/notes",
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration("NotesIntegration", this.notesListFunction),
    });

    this.httpApi.addRoutes({
      path: "/notes/{id}",
      methods: [HttpMethod.GET, HttpMethod.PATCH, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("NotesIdIntegration", this.notesGetFunction),
    });

    // Billing routes
    this.httpApi.addRoutes({
      path: "/billing/checkout",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("BillingCheckoutIntegration", this.billingCheckoutFunction),
    });

    this.httpApi.addRoutes({
      path: "/billing/portal",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("BillingPortalIntegration", this.billingPortalFunction),
    });

    this.httpApi.addRoutes({
      path: "/billing/entitlement",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("BillingEntitlementIntegration", this.billingEntitlementFunction),
    });

    this.httpApi.addRoutes({
      path: "/billing/webhook",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("BillingWebhookIntegration", this.billingWebhookFunction),
    });

    // Attachments routes
    this.httpApi.addRoutes({
      path: "/attachments/presign",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("AttachmentsPresignIntegration", this.attachmentsPresignFunction),
    });

    // Health check
    this.httpApi.addRoutes({
      path: "/health",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("HealthIntegration", this.notesListFunction), // Reuse any function for health
    });
  }
}

// Future CloudFront configuration notes:
// When adding CloudFront distribution:
// - Use Origin Access Control (OAC) for S3 bucket access
// - Set low TTLs for cache optimization (e.g., 0-300 seconds for API responses)
// - Configure custom error pages for SPA routing
// - Enable compression and HTTP/2
// - Set up proper cache behaviors for static assets vs API calls
