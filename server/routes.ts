import type { Express } from "express";
import { createServer, type Server } from "http";
import { LegalController } from "./controllers/legal.controller";
import { DocumentsController } from "./controllers/documents.controller";
import { ChatController } from "./controllers/chat.controller";

export function registerRoutes(app: Express): Server {
  // Initialize controllers
  const legalController = new LegalController();
  const documentsController = new DocumentsController();
  const chatController = new ChatController();

  // API Version prefix
  const apiV1 = '/api/v1';

  // Legal routes
  app.get(`${apiV1}/legal/search`, (req, res) => legalController.search(req, res));
  app.get(`${apiV1}/legal/statutes`, (req, res) => legalController.getStatutes(req, res));
  app.get(`${apiV1}/legal/guidelines`, (req, res) => legalController.getGuidelines(req, res));

  // Document routes
  app.get(`${apiV1}/documents/recent`, (req, res) => documentsController.getRecent(req, res));
  app.get(`${apiV1}/documents/popular`, (req, res) => documentsController.getPopular(req, res));
  app.get(`${apiV1}/documents/categories`, (req, res) => documentsController.getCategories(req, res));

  // Chat routes - ensure these are after API prefix
  // Chat session routes
  app.post(`${apiV1}/sessions`, (req, res) => chatController.createSession(req, res));
  app.get(`${apiV1}/sessions`, (req, res) => chatController.getSessions(req, res));
  app.get(`${apiV1}/sessions/:id`, (req, res) => chatController.getSession(req, res));
  app.patch(`${apiV1}/sessions/:id`, (req, res) => chatController.updateSession(req, res));
  app.delete(`${apiV1}/sessions/:id`, (req, res) => chatController.deleteSession(req, res));
  app.put(`${apiV1}/sessions/:id/pin`, (req, res) => chatController.togglePin(req, res));
  app.post(`${apiV1}/sessions/:id/chat`, 
    (req, res, next) => chatController.upload.array('attachments')(req, res, next),
    (req, res) => chatController.addMessage(req, res)
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
