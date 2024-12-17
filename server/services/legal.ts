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

  /**
   * Search relevant legal documents from Finlex
   */
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

  /**
   * Search KKV consumer guidelines
   */
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

  /**
   * Analyze legal context and provide relevant citations
   */
  async analyzeLegalContext(query: string) {
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

      // Get AI-generated response
      const [legalResponse, contextAnalysis] = await Promise.all([
        this.openAIService.generateLegalResponse(query),
        this.openAIService.analyzeLegalContext(query, relevantSections)
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
        legalContext: contextAnalysis.context,
        confidence: legalResponse.confidence
      };
    } catch (error) {
      console.error('Error in analyzeLegalContext:', error);
      throw new Error('Failed to analyze legal context');
    }
  }

  private async generateLegalResponse(
    query: string,
    finlexDocs: FinlexDocument[],
    kkvGuidelines: KKVGuideline[]
  ): Promise<string> {
    const response = await this.openAIService.generateLegalResponse(query);
    return response.answer;
  }
}
