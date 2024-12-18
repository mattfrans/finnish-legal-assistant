import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { LegalController } from "./controllers/legal.controller";
import { DocumentsController } from "./controllers/documents.controller";
import { ChatController } from "./controllers/chat.controller";
import { TemplatesController } from "./controllers/templates.controller";
import { LegalService } from "./services/legal";

export function registerRoutes(app: Express): Server {
  // Initialize controllers
  const legalController = new LegalController();
  const documentsController = new DocumentsController();
  const chatController = new ChatController();
  const templatesController = new TemplatesController();

  // API Version prefix
  const apiV1 = '/api/v1';

  // Contextual Help routes
  app.post(`${apiV1}/contextual-help`, async (req, res) => {
    try {
      const { message, context, history } = req.body;
      const legalService = new LegalService();
      
      // Generate contextual help based on page context
      const response = await legalService.analyzeLegalContext(
        message || `Generate helpful information about ${context.title}: ${context.description}`
      );
      
      res.json({
        content: response.answer,
        sources: response.sources
      });
    } catch (error: unknown) {
      console.error('Error in contextual help:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to generate contextual help',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  // Legal routes
  app.get(`${apiV1}/legal/search`, (req, res) => legalController.search(req, res));
  app.get(`${apiV1}/legal/statutes`, (req, res) => legalController.getStatutes(req, res));
  app.get(`${apiV1}/legal/guidelines`, (req, res) => legalController.getGuidelines(req, res));

  // Document routes
  app.get(`${apiV1}/documents/recent`, (req, res) => documentsController.getRecent(req, res));
  app.get(`${apiV1}/documents/popular`, (req, res) => documentsController.getPopular(req, res));
  app.get(`${apiV1}/documents/categories`, (req, res) => documentsController.getCategories(req, res));

  // Template routes
  app.get(`${apiV1}/templates`, (req, res) => templatesController.getTemplates(req, res));
  app.get(`${apiV1}/templates/:id`, (req, res) => templatesController.getTemplate(req, res));

  // Chat routes - ensure these are after API prefix
  // Chat session routes
  app.post(`${apiV1}/sessions`, (req, res) => chatController.createSession(req, res));
  app.get(`${apiV1}/sessions`, (req, res) => chatController.getSessions(req, res));
  app.get(`${apiV1}/sessions/:id`, (req, res) => chatController.getSession(req, res));
  app.patch(`${apiV1}/sessions/:id`, (req, res) => chatController.updateSession(req, res));
  app.delete(`${apiV1}/sessions/:id`, (req, res) => chatController.deleteSession(req, res));
  app.put(`${apiV1}/sessions/:id/pin`, (req, res) => chatController.togglePin(req, res));
  app.post(`${apiV1}/sessions/:id/chat`, 
    (req, res, next) => {
      chatController.upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred during upload
          return res.status(400).json({
            error: err.message,
            code: 'UPLOAD_ERROR',
            field: err.field
          });
        } else if (err) {
          // An unknown error occurred
          return res.status(500).json({
            error: 'File upload failed',
            code: 'UPLOAD_ERROR'
          });
        }
        // If successful, proceed to message handler
        chatController.addMessage(req, res);
      });
    }
  );
  app.post(`${apiV1}/sessions/:id/queries/:queryId/feedback`, (req, res) => chatController.addFeedback(req, res));
  app.get(`${apiV1}/sessions/:id/analysis`, (req, res) => chatController.getAnalysis(req, res));

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
