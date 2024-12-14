import { db } from "@db/index";
import { legalDocuments, documentSections } from "@db/schema";
import axios from "axios";
import { pipeline } from "@xenova/transformers";

interface FinlexDocument {
  identifier: string;
  title: string;
  content: string;
  type: "statute" | "case_law" | "guideline";
  publishedAt: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  url: string;
  metadata: {
    category?: string;
    ministry?: string;
    amendments?: string[];
  };
  sections: Array<{
    number: string;
    title?: string;
    content: string;
  }>;
}

export class FinlexService {
  private static FINLEX_API_URL = "https://data.finlex.fi/api/v1";
  private embedder: any;

  constructor() {
    // Initialize the embedder with a multilingual model suitable for Finnish
    this.initializeEmbedder();
  }

  private async initializeEmbedder() {
    try {
      // Use multilingual-e5-small for efficient embedding generation
      this.embedder = await pipeline("feature-extraction", "intfloat/multilingual-e5-small");
    } catch (error) {
      console.error("Failed to initialize embedder:", error);
      throw new Error("Failed to initialize document embedder");
    }
  }

  // Generate embeddings for text using the local model and encode as base64
  private async generateEmbedding(text: string): Promise<string> {
    try {
      const output = await this.embedder(text, {
        pooling: "mean",
        normalize: true,
      });
      const vectorArray = Array.from(output.data);
      return Buffer.from(JSON.stringify(vectorArray)).toString('base64');
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw new Error("Failed to generate document embedding");
    }
  }

  // Fetch documents from Finlex API
  async fetchDocuments(limit = 10): Promise<FinlexDocument[]> {
    try {
      const response = await axios.get(`${FinlexService.FINLEX_API_URL}/statutes`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch documents from Finlex:", error);
      throw new Error("Failed to fetch legal documents");
    }
  }

  // Store documents and their embeddings
  async storeDocument(doc: FinlexDocument) {
    try {
      // Insert the main document
      const [document] = await db.insert(legalDocuments)
        .values({
          identifier: doc.identifier,
          title: doc.title,
          type: doc.type,
          content: doc.content,
          url: doc.url,
          publishedAt: doc.publishedAt,
          effectiveFrom: doc.effectiveFrom,
          effectiveTo: doc.effectiveTo,
          metadata: doc.metadata
        })
        .returning();

      // Process and store sections with embeddings
      for (const section of doc.sections) {
        const embedding = await this.generateEmbedding(section.content);
        
        await db.insert(documentSections)
          .values({
            documentId: document.id,
            sectionNumber: section.number,
            title: section.title,
            content: section.content,
            embedding: embedding // Store embedding directly as JSON array
          });
      }

      return document;
    } catch (error) {
      console.error("Failed to store document:", error);
      throw new Error("Failed to store legal document");
    }
  }

  // Sync documents from Finlex
  async syncDocuments(limit = 10) {
    try {
      const documents = await this.fetchDocuments(limit);
      const results = await Promise.all(
        documents.map(doc => this.storeDocument(doc))
      );
      return results;
    } catch (error) {
      console.error("Failed to sync documents:", error);
      throw new Error("Failed to sync legal documents");
    }
  }
}
