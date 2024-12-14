import { DocumentProcessor } from '../services/document-processor';
import { db } from '@db/index';
import { legalDocuments, documentSections } from '@db/schema';
import { eq } from 'drizzle-orm';

async function testDocumentIngestion() {
  try {
    console.log('=== Testing Document Processing System ===\n');
    
    // Initialize processor
    console.log('1. Initializing document processor...');
    const processor = new DocumentProcessor();
    await processor.initializeEmbedder();
    console.log('✓ Embedder initialized successfully\n');
    
    // Clean up existing test document if it exists
    await db.delete(documentSections)
      .where(eq(documentSections.documentId, 
        db.select({ id: legalDocuments.id })
          .from(legalDocuments)
          .where(eq(legalDocuments.identifier, "test/2024"))
      ));
    await db.delete(legalDocuments)
      .where(eq(legalDocuments.identifier, "test/2024"));
    
    const testDoc = {
      identifier: "test/2024",
      title: "Testilaki",
      content: "Tämä on testilaki suomen kielellä.",
      sections: [
        {
          number: "1",
          title: "Testiosa",
          content: "Tämän lain tarkoituksena on testata dokumenttien käsittelyä."
        }
      ],
      metadata: {
        publishedAt: new Date().toISOString(),
        category: "Testi",
        ministry: "Testausministeriö"
      }
    };

    // Test document processing
    console.log('2. Processing test document...');
    await processor.processDocument(testDoc);
    console.log('✓ Document processed successfully!\n');

    // Verify document storage
    console.log('3. Verifying document storage...');
    const storedDoc = await db.query.legalDocuments.findFirst({
      where: eq(legalDocuments.identifier, "test/2024"),
      with: {
        sections: true
      }
    });
    console.log('Stored document:', {
      identifier: storedDoc?.identifier,
      title: storedDoc?.title,
      sectionsCount: storedDoc?.sections.length
    });
    console.log('✓ Document storage verified\n');

    // Test embedding dimensions
    console.log('4. Testing embedding dimensions...');
    const testPhrase = "Mikä on tämän lain tarkoitus?";
    const { vector, embedding } = await processor.generateEmbedding(testPhrase);
    console.log('Generated embedding dimensions:', vector.length);
    console.log('✓ Embeddings generation working\n');

    // Test similarity search
    console.log('5. Testing similarity search...');
    const similar = await processor.findSimilarSections(testPhrase);
    console.log('\nSimilar sections found:');
    similar.forEach((s: any) => {
      console.log('\nDocument:', s.document_title);
      console.log('Similarity:', (s.similarity * 100).toFixed(2) + '%');
      console.log('Content preview:', s.content.substring(0, 100) + '...');
      console.log('-'.repeat(80));
    });
    console.log('✓ Similarity search completed');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
  }
}

testDocumentIngestion().catch(console.error);
