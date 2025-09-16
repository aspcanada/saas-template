import { NotesDal } from "./notes-dal";
import { Note, OrgTenantId } from "@saas-template/shared";
import { DynamoDBClient, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

/**
 * DynamoDB item shape for notes
 */
interface DynamoNoteItem {
  PK: string;                    // `ORG#${orgId}`
  SK: string;                    // `NOTE#${noteId}`
  orgId: string;
  noteId: string;
  createdByUserId: string;
  subjectId?: string;            // optional
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // GSI projections:
  GSI2PK?: string;               // `ORG#${orgId}#USER#${createdByUserId}`
  GSI2SK?: string;               // `NOTE#${noteId}#${createdAtISO}`
  GSI1PK?: string;               // `ORG#${orgId}#SUBJECT#${subjectId}` (if subjectId present)
  GSI1SK?: string;               // `NOTE#${noteId}#${createdAtISO}` (if subjectId present)
}

/**
 * DynamoDB implementation of NotesDal
 * Uses the specified item shapes and GSI patterns
 */
export class DynamoNotesDal implements NotesDal {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    // Validate required environment variables
    const region = process.env.AWS_REGION;
    const tableName = process.env.TABLE_NAME || process.env.DYNAMO_TABLE_NAME;
    
    if (!region) {
      throw new Error("AWS_REGION environment variable is required when using DynamoDB DAL");
    }
    
    if (!tableName) {
      throw new Error("TABLE_NAME or DYNAMO_TABLE_NAME environment variable is required when using DynamoDB DAL");
    }

    // Initialize DynamoDB client
    const client = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
    
    console.log(`🔧 DynamoNotesDal initialized with table: ${this.tableName} in region: ${region}`);
  }

  async createNote(params: {
    orgId: OrgTenantId;
    userId: string;
    subjectId?: string;
    title: string;
    content: string;
  }): Promise<Note> {
    const noteId = this.generateNoteId();
    const now = new Date().toISOString();
    const createdAtISO = now.replace(/[:.]/g, "-"); // ISO format safe for DynamoDB sort keys

    const item: DynamoNoteItem = {
      PK: `ORG#${params.orgId}`,
      SK: `NOTE#${noteId}`,
      orgId: params.orgId,
      noteId,
      createdByUserId: params.userId,
      subjectId: params.subjectId,
      title: params.title,
      content: params.content,
      createdAt: now,
      updatedAt: now,
      // GSI2: user → notes
      GSI2PK: `ORG#${params.orgId}#USER#${params.userId}`,
      GSI2SK: `NOTE#${noteId}#${createdAtISO}`,
    };

    // Add GSI1 attributes if subjectId is present
    if (params.subjectId) {
      item.GSI1PK = `ORG#${params.orgId}#SUBJECT#${params.subjectId}`;
      item.GSI1SK = `NOTE#${noteId}#${createdAtISO}`;
    }

    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      }));

      return this.dynamoItemToNote(item);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new Error("Note with this ID already exists");
      }
      throw error;
    }
  }

  async getNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<Note | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `ORG#${params.orgId}`,
        SK: `NOTE#${params.noteId}`,
      },
    }));

    if (!result.Item) {
      return null;
    }

    const item = result.Item as DynamoNoteItem;
    
    // Verify the item belongs to the requested organization
    if (item.orgId !== params.orgId) {
      return null;
    }

    return this.dynamoItemToNote(item);
  }

  async listNotesByUser(params: {
    orgId: OrgTenantId;
    userId: string;
  }): Promise<Note[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :gsi2pk",
      ExpressionAttributeValues: {
        ":gsi2pk": `ORG#${params.orgId}#USER#${params.userId}`,
      },
    }));

    return (result.Items || []).map(item => this.dynamoItemToNote(item as DynamoNoteItem));
  }

  async listNotesByOrg(params: {
    orgId: OrgTenantId;
  }): Promise<Note[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk_prefix)",
      ExpressionAttributeValues: {
        ":pk": `ORG#${params.orgId}`,
        ":sk_prefix": "NOTE#",
      },
    }));

    return (result.Items || []).map(item => this.dynamoItemToNote(item as DynamoNoteItem));
  }

  async updateNote(params: {
    orgId: OrgTenantId;
    noteId: string;
    title?: string;
    content?: string;
    subjectId?: string;
  }): Promise<Note | null> {
    const now = new Date().toISOString();
    const createdAtISO = now.replace(/[:.]/g, "-");

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
      ":orgId": params.orgId,
      ":updatedAt": now,
    };

    if (params.title !== undefined) {
      updateExpressions.push("#title = :title");
      expressionAttributeNames["#title"] = "title";
      expressionAttributeValues[":title"] = params.title;
    }

    if (params.content !== undefined) {
      updateExpressions.push("#content = :content");
      expressionAttributeNames["#content"] = "content";
      expressionAttributeValues[":content"] = params.content;
    }

    if (params.subjectId !== undefined) {
      updateExpressions.push("#subjectId = :subjectId");
      expressionAttributeNames["#subjectId"] = "subjectId";
      expressionAttributeValues[":subjectId"] = params.subjectId;

      // Update GSI1 attributes when subjectId changes
      if (params.subjectId) {
        updateExpressions.push("GSI1PK = :gsi1pk, GSI1SK = :gsi1sk");
        expressionAttributeValues[":gsi1pk"] = `ORG#${params.orgId}#SUBJECT#${params.subjectId}`;
        expressionAttributeValues[":gsi1sk"] = `NOTE#${params.noteId}#${createdAtISO}`;
      } else {
        updateExpressions.push("GSI1PK = :gsi1pk, GSI1SK = :gsi1sk");
        expressionAttributeValues[":gsi1pk"] = undefined;
        expressionAttributeValues[":gsi1sk"] = undefined;
      }
    }

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    try {
      const result = await this.dynamoClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORG#${params.orgId}`,
          SK: `NOTE#${params.noteId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "orgId = :orgId",
        ReturnValues: "ALL_NEW",
      }));

      return this.dynamoItemToNote(result.Attributes as DynamoNoteItem);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return null; // Note not found or doesn't belong to org
      }
      throw error;
    }
  }

  async deleteNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<boolean> {
    try {
      await this.dynamoClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORG#${params.orgId}`,
          SK: `NOTE#${params.noteId}`,
        },
        ConditionExpression: "orgId = :orgId",
        ExpressionAttributeValues: {
          ":orgId": params.orgId,
        },
      }));

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false; // Note not found or doesn't belong to org
      }
      throw error;
    }
  }

  async listNotesBySubject(params: {
    orgId: OrgTenantId;
    subjectId: string;
  }): Promise<Note[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `ORG#${params.orgId}#SUBJECT#${params.subjectId}`,
      },
    }));

    return (result.Items || []).map(item => this.dynamoItemToNote(item as DynamoNoteItem));
  }

  /**
   * Generate a unique note ID
   */
  private generateNoteId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert DynamoDB item to Note interface
   */
  private dynamoItemToNote(item: DynamoNoteItem): Note {
    return {
      id: item.noteId,
      orgId: item.orgId,
      userId: item.createdByUserId,
      subjectId: item.subjectId,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
