import { Request, Response } from 'express';
import { db } from '@db/index';
import { legalDocuments } from '@db/schema';
import { desc, sql } from 'drizzle-orm';

export class DocumentsController {
  async getRecent(req: Request, res: Response) {
    try {
      const documents = await db.query.legalDocuments.findMany({
        orderBy: [desc(legalDocuments.publishedAt)],
        limit: 10
      });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch recent documents',
        code: 'FETCH_ERROR'
      });
    }
  }

  async getPopular(req: Request, res: Response) {
    try {
      // TODO: Implement actual popularity metrics
      // For now, return most referenced documents
      const documents = await db.query.legalDocuments.findMany({
        orderBy: [desc(legalDocuments.updatedAt)],
        limit: 10
      });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch popular documents',
        code: 'FETCH_ERROR' 
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await db.execute(
        sql`SELECT DISTINCT metadata->>'category' as category 
            FROM ${legalDocuments}
            WHERE metadata->>'category' IS NOT NULL
            ORDER BY category`
      );
      res.json(categories);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch categories',
        code: 'FETCH_ERROR'
      });
    }
  }
}
