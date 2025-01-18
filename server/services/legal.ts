import axios from 'axios';
import { OpenAIService } from './openai';

interface FinlexDocument {
  identifier: string;
  title: string;
  content: string;
  sections: Array<{
    identifier: string;
    content: string;
  }>;
}

interface KKVGuideline {
  title: string;
  content: string;
  link: string;
}

export class LegalService {
  private static FINLEX_BASE_URL = 'https://data.finlex.fi/api/v1';
  private static KKV_BASE_URL = 'https://www.kkv.fi/api';
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  async searchFinlex(query: string): Promise<FinlexDocument[]> {
    try {
      // TODO: Replace with actual Finlex API integration
      // For now, return mock data based on common Finnish laws
      return [
        {
          identifier: '1978/038',
          title: 'Kuluttajansuojalaki',
          content: 'Kuluttajansuojalain säännökset...',
          sections: [
            {
              identifier: '2 luku',
              content: 'Markkinointi ja menettelyt asiakassuhteessa...'
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error searching Finlex:', error);
      throw new Error('Failed to search legal documents');
    }
  }

  async searchKKVGuidelines(query: string): Promise<KKVGuideline[]> {
    try {
      // TODO: Replace with actual KKV API integration
      return [
        {
          title: 'Kuluttajan oikeudet',
          content: 'Kuluttajalla on oikeus...',
          link: 'https://www.kkv.fi/kuluttaja-asiat/kuluttajan-oikeudet/'
        }
      ];
    } catch (error) {
      console.error('Error searching KKV guidelines:', error);
      throw new Error('Failed to search consumer guidelines');
    }
  }

  async analyzeLegalContext(query: string, files?: Array<{ type: string, content: string, name: string }>) {
    try {
      // Fetch relevant documents and guidelines
      const [finlexDocs, kkvGuidelines] = await Promise.all([
        this.searchFinlex(query),
        this.searchKKVGuidelines(query)
      ]);

      // Prepare context for OpenAI
      const relevantSections = finlexDocs
        .flatMap(doc => doc.sections)
        .map(section => `${section.identifier}: ${section.content}`);

      // Add file context if provided
      let fileContext = '';
      if (files && files.length > 0) {
        fileContext = '\n\nUploaded files context:\n' + files.map(file => 
          `File: ${file.name}\nType: ${file.type}\nContent: ${file.content}`
        ).join('\n\n');
      }

      // Get AI-generated response with file context included
      const [legalResponse, analysisResult] = await Promise.all([
        this.openAIService.generateLegalResponse(query + fileContext),
        this.openAIService.analyzeLegalContext(query, files)
      ]);

      // Merge AI response with document sources
      const sources = [
        ...(legalResponse.sources || []),
        ...finlexDocs.map(doc => ({
          link: `https://finlex.fi/fi/laki/ajantasa/${doc.identifier.replace('/', '')}`,
          title: doc.title,
          section: doc.sections[0]?.identifier,
          type: 'finlex' as const,
          identifier: doc.identifier,
          relevance: 0.9
        })),
        ...kkvGuidelines.map(guide => ({
          link: guide.link,
          title: guide.title,
          type: 'kkv' as const,
          relevance: 0.8
        }))
      ];

      return {
        answer: legalResponse.answer,
        sources: sources,
        confidence: legalResponse.confidence,
        fileAnalysis: files ? await this.analyzeUploadedFiles(files) : undefined
      };
    } catch (error) {
      console.error('Error in analyzeLegalContext:', error);
      throw new Error('Failed to analyze legal context');
    }
  }

  private async analyzeUploadedFiles(files: Array<{ type: string, content: string }>) {
    try {
      const analyses = await Promise.all(files.map(async file => {
        let analysis = '';
        if (file.type.startsWith('image/')) {
          // Image analysis
          analysis = await this.openAIService.analyzeImage(file.content);
        } else {
          // Document content analysis
          analysis = await this.openAIService.analyzeLegalDocument(file.content);
        }
        return {
          type: file.type,
          analysis
        };
      }));
      
      return analyses;
    } catch (error) {
      console.error('Error analyzing files:', error);
      return [];
    }
  }
}