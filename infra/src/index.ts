// CDK infrastructure definitions
// This file will contain AWS CDK v2 stack definitions

import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Table, BillingMode, AttributeType, TableEncryption } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, BlockPublicAccess, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class CoreStack extends Stack {
  public readonly table: Table;
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB table with on-demand billing
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

    // S3 bucket for attachments
    this.bucket = new Bucket(this, "AttachmentsBucket", {
      bucketName: `saas-template-attachments-${this.account}-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
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
  }
}
