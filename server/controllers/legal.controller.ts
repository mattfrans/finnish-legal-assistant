import { Request, Response } from 'express';
import { LegalService } from '../services/legal';
import type { LegalResponse } from '../types/api';

export class LegalController {
  private legalService: LegalService;

  constructor() {
    this.legalService = new LegalService();
  }

  async search(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid query parameter',
          code: 'INVALID_QUERY'
        });
      }

      const startTime = Date.now();
      const legalContext = await this.legalService.analyzeLegalContext(query);
      
      const response: LegalResponse = {
        answer: legalContext.answer,
        confidence: legalContext.confidence,
        citations: {
          statutes: legalContext.sources
            .filter(s => s.type === 'finlex')
            .map(s => ({
              id: s.identifier!,
              title: s.title,
              url: s.link,
              type: 'statute',
              relevance: s.relevance,
              section: s.section,
              jurisdiction: 'FI'
            })),
          cases: [],
          guidelines: legalContext.sources
            .filter(s => s.type === 'kkv')
            .map(s => ({
              id: s.link.split('/').pop() || '',
              title: s.title,
              url: s.link,
              type: 'guideline',
              relevance: s.relevance,
              jurisdiction: 'FI'
            }))
        },
        context: {
          relevantSections: legalContext.sources
            .filter(s => s.section)
            .map(s => s.section!),
          effectiveDates: {
            from: new Date().toISOString() // TODO: Get actual effective dates
          },
          jurisdiction: 'FI'
        },
        metadata: {
          processingTime: Date.now() - startTime,
          sourcesUsed: ['finlex', 'kkv'],
          lastUpdated: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in legal search:', error);
      res.status(500).json({ 
        error: 'Failed to process legal query',
        code: 'PROCESSING_ERROR',
        details: error instanceof Error ? error.message : undefined
      });
    }
  }

  async getStatutes(req: Request, res: Response) {
    try {
      const documents = await this.legalService.searchFinlex('');
      res.json(documents);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch statutes',
        code: 'FETCH_ERROR'
      });
    }
  }

  async getGuidelines(req: Request, res: Response) {
    try {
      const guidelines = await this.legalService.searchKKVGuidelines('');
      res.json(guidelines);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch guidelines',
        code: 'FETCH_ERROR'
      });
    }
  }
}
