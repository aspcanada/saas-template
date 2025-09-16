// Test setup for API tests
// Jest globals are available in test environment

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      get: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      scan: jest.fn()
    }))
  }
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      list: jest.fn()
    },
    checkout: {
      sessions: {
        create: jest.fn()
      }
    },
    billingPortal: {
      sessions: {
        create: jest.fn()
      }
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

// Mock shared package
jest.mock('@saas-template/shared', () => ({
  Note: {},
  OrgTenantId: {},
  KeyBuilders: {
    orgTenantId: jest.fn((orgId: string) => `ORG#${orgId}`),
    subjectNotes: jest.fn((orgId: string, subjectId: string) => `ORG#${orgId}#SUBJECT#${subjectId}`),
    userNotes: jest.fn((orgId: string, userId: string) => `ORG#${orgId}#USER#${userId}`),
    note: jest.fn((orgId: string, noteId: string, createdAt: string) => `NOTE#${noteId}#${createdAt}`)
  }
}));

// Mock node-fetch
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DYNAMO_TABLE_NAME = 'test-table';
process.env.BUCKET_NAME = 'test-bucket';
process.env.CLERK_JWKS_URL = 'https://test.clerk.accounts.dev/.well-known/jwks.json';
process.env.CLERK_JWT_ISSUER = 'https://test.clerk.accounts.dev';
