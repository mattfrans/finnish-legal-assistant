import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import multer from "multer";
import { LegalController } from "./controllers/legal.controller";
import { DocumentsController } from "./controllers/documents.controller";
import { ChatController } from "./controllers/chat.controller";
import { TemplatesController } from "./controllers/templates.controller";
import { LegalService } from "./services/legal";

// Middleware to ensure user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
};

// Middleware to check subscription status
const requireActiveSubscription = (req: any, res: any, next: any) => {
  if (!req.user.subscriptionStatus || 
      req.user.subscriptionStatus === 'expired' || 
      req.user.subscriptionStatus === 'cancelled') {
    return res.status(403).json({ 
      error: 'Active subscription required', 
      code: 'SUBSCRIPTION_REQUIRED' 
    });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  // Initialize controllers
  const legalController = new LegalController();
  const documentsController = new DocumentsController();
  const chatController = new ChatController();
  const templatesController = new TemplatesController();

  // Set up authentication
  setupAuth(app);

  // API Version prefix
  const apiV1 = '/api/v1';

  // Public routes (no auth required)
  app.post('/api/register', (req, res, next) => {
    // Handled by auth.ts
  });
  app.post('/api/login', (req, res, next) => {
    // Handled by auth.ts
  });
  app.get('/api/user', (req, res) => {
    // Handled by auth.ts
  });

  // Protected routes
  // Contextual Help routes
  app.post(`${apiV1}/contextual-help`, requireAuth, async (req, res) => {
    try {
      const { message, context, history } = req.body;
      const legalService = new LegalService();

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

  // Legal routes (require active subscription)
  app.get(`${apiV1}/legal/search`, requireAuth, requireActiveSubscription, (req, res) => legalController.search(req, res));
  app.get(`${apiV1}/legal/statutes`, requireAuth, requireActiveSubscription, (req, res) => legalController.getStatutes(req, res));
  app.get(`${apiV1}/legal/guidelines`, requireAuth, requireActiveSubscription, (req, res) => legalController.getGuidelines(req, res));

  // Document routes
  app.get(`${apiV1}/documents/recent`, requireAuth, (req, res) => documentsController.getRecent(req, res));
  app.get(`${apiV1}/documents/popular`, requireAuth, (req, res) => documentsController.getPopular(req, res));
  app.get(`${apiV1}/documents/categories`, requireAuth, (req, res) => documentsController.getCategories(req, res));

  // Template routes (require active subscription)
  app.get(`${apiV1}/templates`, requireAuth, requireActiveSubscription, (req, res) => templatesController.getTemplates(req, res));
  app.get(`${apiV1}/templates/:id`, requireAuth, requireActiveSubscription, (req, res) => templatesController.getTemplate(req, res));

  // Chat routes
  app.post(`${apiV1}/sessions`, requireAuth, (req, res) => chatController.createSession(req, res));
  app.get(`${apiV1}/sessions`, requireAuth, (req, res) => chatController.getSessions(req, res));
  app.get(`${apiV1}/sessions/:id`, requireAuth, (req, res) => chatController.getSession(req, res));
  app.patch(`${apiV1}/sessions/:id`, requireAuth, (req, res) => chatController.updateSession(req, res));
  app.delete(`${apiV1}/sessions/:id`, requireAuth, (req, res) => chatController.deleteSession(req, res));
  app.put(`${apiV1}/sessions/:id/pin`, requireAuth, (req, res) => chatController.togglePin(req, res));

  // Chat message routes (require active subscription for advanced features)
  app.post(`${apiV1}/sessions/:id/chat`, 
    requireAuth,
    requireActiveSubscription,
    (req, res, next) => {
      chatController.upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: err.message,
            code: 'UPLOAD_ERROR',
            field: err.field
          });
        } else if (err) {
          return res.status(500).json({
            error: 'File upload failed',
            code: 'UPLOAD_ERROR'
          });
        }
        chatController.addMessage(req, res);
      });
    }
  );

  // Feedback and analysis routes
  app.post(`${apiV1}/sessions/:id/queries/:queryId/feedback`, requireAuth, (req, res) => chatController.addFeedback(req, res));
  app.get(`${apiV1}/sessions/:id/analysis`, requireAuth, requireActiveSubscription, (req, res) => chatController.getAnalysis(req, res));

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