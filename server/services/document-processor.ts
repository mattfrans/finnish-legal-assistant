import axios from 'axios';
import { db } from '@db/index';
import { legalDocuments, documentSections } from '@db/schema';
import { pipeline, env } from '@xenova/transformers';

// Disable unnecessary warnings
env.useBrowserCache = false;
env.allowLocalModels = false;
import { sql } from 'drizzle-orm';

interface FinlexDocument {
  identifier: string;
  title: string;
  content: string;
  sections: Array<{
    number: string;
    title?: string;
    content: string;
  }>;
  metadata: {
    publishedAt: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    category?: string;
    ministry?: string;
  };
}

export class DocumentProcessor {
  private static FINLEX_BASE_URL = 'https://data.finlex.fi/api/v1';
  private embedder: any;

  constructor() {
    // Initialize the multilingual BERT model for embeddings
    this.initializeEmbedder();
  }

  public async initializeEmbedder() {
    try {
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/multilingual-e5-small',
        { revision: 'main' }
      );
      console.log('Embedder initialized successfully');
    } catch (error) {
      console.error('Error initializing embedder:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text using multilingual E5
   */
  private async generateEmbedding(text: string): Promise<{ embedding: string, vector: number[] }> {
    try {
      // Ensure embedder is initialized
      if (!this.embedder) {
        await this.initializeEmbedder();
      }

      // Generate embeddings
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true
      });

      // Get the embedding array
      const vector = Array.from(output.data);

      // Convert to base64 for storage
      const buffer = Buffer.from(Float32Array.from(vector).buffer);
      const embedding = buffer.toString('base64');

      console.log(`Generated embedding for text (${text.substring(0, 50)}...)`);
      return { embedding, vector };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Process and store a legal document with its sections
   */
  async processDocument(doc: FinlexDocument) {
    try {
      // Insert the main document
      const [document] = await db.insert(legalDocuments).values({
        type: 'statute',
        identifier: doc.identifier,
        title: doc.title,
        content: doc.content,
        url: `https://finlex.fi/fi/laki/ajantasa/${doc.identifier.replace('/', '')}`,
        publishedAt: new Date(doc.metadata.publishedAt),
        effectiveFrom: doc.metadata.effectiveFrom ? new Date(doc.metadata.effectiveFrom) : null,
        effectiveTo: doc.metadata.effectiveTo ? new Date(doc.metadata.effectiveTo) : null,
        metadata: {
          category: doc.metadata.category,
          ministry: doc.metadata.ministry
        }
      }).returning();

      // Process and store each section with embeddings
      for (const section of doc.sections) {
        const { embedding, vector } = await this.generateEmbedding(
          `${doc.title}\n${section.title || ''}\n${section.content}`
        );

        await db.insert(documentSections).values({
          documentId: document.id,
          sectionNumber: section.number,
          title: section.title || null,
          content: section.content,
          embedding,
          embedding_vector: sql`${JSON.stringify(vector)}::vector`
        });
      }

      console.log(`Processed document: ${doc.identifier}`);
    } catch (error) {
      console.error(`Error processing document ${doc.identifier}:`, error);
      throw error;
    }
  }

  /**
   * Fetch documents from Finlex API
   */
  async fetchFinlexDocuments(limit: number = 10): Promise<FinlexDocument[]> {
    try {
      // TODO: Implement actual Finlex API integration
      // For now returning mock data
      return [{
        identifier: "1978/038",
        title: "Kuluttajansuojalaki",
        content: "Kuluttajansuojalain säännökset...",
        sections: [
          {
            number: "1",
            title: "Yleiset säännökset",
            content: "Tämä laki koskee kulutushyödykkeiden tarjontaa, myyntiä ja muuta markkinointia elinkeinonharjoittajilta kuluttajille."
          }
        ],
        metadata: {
          publishedAt: "1978-09-20",
          category: "Kuluttajansuoja",
          ministry: "Oikeusministeriö"
        }
      }];
    } catch (error) {
      console.error('Error fetching Finlex documents:', error);
      throw error;
    }
  }

  /**
   * Find similar document sections for a given query
   */
  async findSimilarSections(query: string, limit: number = 5) {
    const { vector } = await this.generateEmbedding(query);
    
    // Perform vector similarity search
    const similarSections = await db.execute(sql`
      SELECT 
        ds.content,
        ds.title as section_title,
        ld.title as document_title,
        ld.identifier,
        1 - (ds.embedding_vector <-> ${vector}::vector) as similarity
      FROM document_sections ds
      JOIN legal_documents ld ON ds.document_id = ld.id
      ORDER BY ds.embedding_vector <-> ${vector}::vector
      LIMIT ${limit}
    `);

    return similarSections;
  }
}
