import { Request, Response } from 'express';
import { db } from '../../db/index';
import { queries } from '../../db/schema';
import { desc, sql } from 'drizzle-orm';

export class DocumentsController {
  async getRecent(req: Request, res: Response) {
    try {
      // For now, return recent queries that have document attachments
      const documents = await db.select()
        .from(queries)
        .where(sql`attachments IS NOT NULL`)
        .orderBy(desc(queries.createdAt))
        .limit(10);

      res.json(documents);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent documents',
        code: 'FETCH_ERROR'
      });
    }
  }

  async getPopular(req: Request, res: Response) {
    try {
      // For now, return most recently accessed documents
      const documents = await db.select()
        .from(queries)
        .where(sql`attachments IS NOT NULL`)
        .orderBy(desc(queries.createdAt))
        .limit(10);

      res.json(documents);
    } catch (error) {
      console.error('Error fetching popular documents:', error);
      res.status(500).json({ 
        error: 'Failed to fetch popular documents',
        code: 'FETCH_ERROR' 
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      // For now, return hardcoded categories until we implement proper categorization
      const categories = [
        { category: 'Contracts' },
        { category: 'Legal Opinions' },
        { category: 'Court Documents' },
        { category: 'Legislation' }
      ];
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch categories',
        code: 'FETCH_ERROR'
      });
    }
  }
}