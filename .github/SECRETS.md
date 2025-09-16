# GitHub Secrets Configuration

This document outlines the required GitHub secrets for automated deployment.

## Required Secrets

### AWS Credentials (Production)
- `AWS_ACCESS_KEY_ID` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for production
- `AWS_REGION` - AWS region (default: us-east-1)

### AWS Credentials (Development)
- `AWS_ACCESS_KEY_ID_DEV` - AWS access key for development
- `AWS_SECRET_ACCESS_KEY_DEV` - AWS secret key for development
- `AWS_REGION_DEV` - AWS region for development (default: us-east-1)
- `AWS_ACCOUNT_ID_DEV` - AWS account ID for development

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (production)
- `CLERK_SECRET_KEY` - Clerk secret key (production)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` - Clerk publishable key (development)
- `CLERK_SECRET_KEY_DEV` - Clerk secret key (development)

### Stripe Billing
- `NEXT_PUBLIC_STRIPE_PRICE_PRO` - Stripe Pro plan price ID (production)
- `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` - Stripe Business plan price ID (production)
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_DEV` - Stripe Pro plan price ID (development)
- `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_DEV` - Stripe Business plan price ID (development)

### Vercel Deployment
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Setting Up Secrets

### 1. Go to GitHub Repository Settings
1. Navigate to your repository on GitHub
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"

### 2. Add Repository Secrets
Click "New repository secret" and add each secret with the exact name listed above.

### 3. Add Environment Secrets
For environment-specific secrets:
1. Go to "Environments" section
2. Create environments: `production` and `development`
3. Add environment-specific secrets to each environment

## Environment Variables

### Production Environment
```bash
# AWS
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
AWS_REGION=us-east-1

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Stripe
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_...

# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### Development Environment
```bash
# AWS
AWS_ACCESS_KEY_ID_DEV=your_dev_access_key
AWS_SECRET_ACCESS_KEY_DEV=your_dev_secret_key
AWS_REGION_DEV=us-east-1
AWS_ACCOUNT_ID_DEV=123456789012

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV=pk_test_...
CLERK_SECRET_KEY_DEV=sk_test_...

# Stripe
NEXT_PUBLIC_STRIPE_PRICE_PRO_DEV=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_DEV=price_...

# Vercel (same as production)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

## Security Best Practices

1. **Never commit secrets to code** - Always use GitHub secrets
2. **Use different credentials** for production and development
3. **Rotate secrets regularly** - Update secrets periodically
4. **Use least privilege** - Grant minimal required permissions
5. **Monitor access** - Review who has access to secrets

## Troubleshooting

### Common Issues
1. **Secret not found** - Check the exact name matches the documentation
2. **Permission denied** - Verify AWS credentials have correct permissions
3. **Environment not found** - Ensure environments are created in GitHub
4. **Invalid format** - Check that secret values are properly formatted

### Verification
To verify secrets are working:
1. Check GitHub Actions logs for authentication errors
2. Test AWS credentials locally: `aws sts get-caller-identity`
3. Test AWS S3 access: `aws s3 ls`
4. Test Clerk credentials in your application

## Getting Required Values

### AWS Credentials
1. Go to AWS IAM Console
2. Create a new user or use existing user
3. Attach these minimal policies:
   - `AmazonDynamoDBFullAccess` (for DynamoDB table creation)
   - `AmazonS3FullAccess` (for S3 buckets and CloudFront)
   - `AWSLambdaFullAccess` (for Lambda functions)
   - `AmazonAPIGatewayAdministrator` (for API Gateway)
   - `CloudFrontFullAccess` (for CloudFront distribution)
   - `IAMFullAccess` (for Lambda execution roles)
   - `CloudFormationFullAccess` (CDK uses CloudFormation under the hood)
4. Create access keys and copy the values

**Why these permissions?**
- CDK needs to create/modify AWS resources
- GitHub Actions uses these credentials to run `cdk deploy`
- Without these permissions, deployment will fail

### Clerk Credentials
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create or select your application
3. Go to "API Keys" section
4. Copy the publishable and secret keys

### Stripe Credentials
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create products and prices
3. Copy the price IDs from the products
