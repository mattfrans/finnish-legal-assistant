import { Request, Response } from 'express';
import { db } from '@db/index';
import { documentTemplates } from '@db/schema';
import { desc, eq } from 'drizzle-orm';

export class TemplatesController {
  async getTemplates(req: Request, res: Response) {
    try {
      const { category } = req.query;
      let query = db.select().from(documentTemplates);
      
      if (category) {
        query = query.where(eq(documentTemplates.category, category as string));
      }

      const templates = await query
        .where(eq(documentTemplates.isActive, true))
        .orderBy(desc(documentTemplates.updatedAt));

      res.json(templates);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch templates',
        code: 'FETCH_ERROR'
      });
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [template] = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.id, parseInt(id)))
        .limit(1);

      if (!template) {
        return res.status(404).json({
          error: 'Template not found',
          code: 'NOT_FOUND'
        });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch template',
        code: 'FETCH_ERROR'
      });
    }
  }
}
