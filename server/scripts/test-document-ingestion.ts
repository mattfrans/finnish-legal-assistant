import { DocumentProcessor } from '../services/document-processor';

async function testDocumentIngestion() {
  try {
    console.log('Initializing document processor...');
    const processor = new DocumentProcessor();
    
    // Initialize embedder explicitly
    await processor.initializeEmbedder();
    console.log('Embedder initialized successfully');
    
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

    console.log('Processing test document...');
    await processor.processDocument(testDoc);
    console.log('Document processed successfully!');

    // Test similarity search
    console.log('\nTesting similarity search...');
    const similar = await processor.findSimilarSections("Mikä on tämän lain tarkoitus?");
    console.log('Similar sections found:', similar);
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testDocumentIngestion().catch(console.error);
