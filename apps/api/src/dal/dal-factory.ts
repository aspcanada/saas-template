import { NotesDal } from "./notes-dal";
import { InMemoryNotesDal } from "./in-memory-notes-dal";
import { DynamoNotesDal } from "./dynamo-notes-dal";

/**
 * Factory for creating DAL instances based on environment configuration
 */
export class DalFactory {
  private static notesDal: NotesDal | null = null;

  /**
   * Get the configured Notes DAL instance
   */
  static getNotesDal(): NotesDal {
    if (!this.notesDal) {
      this.notesDal = this.createNotesDal();
    }
    return this.notesDal;
  }

  /**
   * Create a new Notes DAL instance based on environment configuration
   */
  private static createNotesDal(): NotesDal {
    const dalType = process.env.DAL || "inmemory";
    
    console.log(`🔧 Creating Notes DAL: ${dalType}`);
    
    switch (dalType.toLowerCase()) {
      case "inmemory":
        return new InMemoryNotesDal();
      
      case "dynamo":
      case "dynamodb":
        try {
          return new DynamoNotesDal();
        } catch (error) {
          console.error(`❌ Failed to initialize DynamoDB DAL: ${error instanceof Error ? error.message : "Unknown error"}`);
          console.error("💡 Make sure to set AWS_REGION and TABLE_NAME environment variables");
          console.error("💡 Falling back to in-memory DAL for development");
          return new InMemoryNotesDal();
        }
      
      default:
        console.warn(`⚠️  Unknown DAL type: ${dalType}. Falling back to inmemory.`);
        return new InMemoryNotesDal();
    }
  }

  /**
   * Reset the DAL instance (useful for testing)
   */
  static reset(): void {
    this.notesDal = null;
  }
}
