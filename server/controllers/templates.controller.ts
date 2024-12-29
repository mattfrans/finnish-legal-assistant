import { Request, Response } from 'express';
import { db } from '../../db/index';
import { queries } from '../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

// Define template types for the initial implementation
const DEFAULT_TEMPLATES = {
  contracts: [
    {
      id: 1,
      title: "Palvelusopimus",
      description: "Yleinen palvelusopimuspohja",
      category: "contracts",
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Työsopimus",
      description: "Yleinen työsopimuspohja",
      category: "contracts",
      isActive: true,
      updatedAt: new Date().toISOString()
    }
  ],
  legal_opinions: [
    {
      id: 3,
      title: "Oikeudellinen Lausunto",
      description: "Oikeudellisen lausunnon pohja",
      category: "legal_opinions",
      isActive: true,
      updatedAt: new Date().toISOString()
    }
  ]
};

export class TemplatesController {
  async getTemplates(req: Request, res: Response) {
    try {
      const { category } = req.query;
      let templates = [];

      if (category) {
        templates = DEFAULT_TEMPLATES[category as keyof typeof DEFAULT_TEMPLATES] || [];
      } else {
        templates = Object.values(DEFAULT_TEMPLATES).flat();
      }

      res.json(templates.filter(t => t.isActive));
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ 
        error: 'Failed to fetch templates',
        code: 'FETCH_ERROR'
      });
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const templateId = parseInt(id);

      const template = Object.values(DEFAULT_TEMPLATES)
        .flat()
        .find(t => t.id === templateId && t.isActive);

      if (!template) {
        return res.status(404).json({
          error: 'Template not found',
          code: 'NOT_FOUND'
        });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ 
        error: 'Failed to fetch template',
        code: 'FETCH_ERROR'
      });
    }
  }
}