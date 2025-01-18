import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import multer from "multer";
import { LegalController } from "./controllers/legal.controller";
import { DocumentsController } from "./controllers/documents.controller";
import { ChatController } from "./controllers/chat.controller";
import { TemplatesController } from "./controllers/templates.controller";
import { LegalService } from "./services/legal";
import rateLimit from 'express-rate-limit';

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 chat requests per minute
  message: { error: 'Too many chat requests, please try again later', code: 'CHAT_RATE_LIMIT_EXCEEDED' }
});

// Middleware to ensure user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  // Temporarily bypass auth for development
  return next();

  // Original auth check
  console.log('Auth check - Session:', {
    id: req.sessionID,
    user: req.user?.id,
    isAuthenticated: req.isAuthenticated()
  });

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
};

// Middleware to check subscription status
const requireActiveSubscription = (req: any, res: any, next: any) => {
  // Temporarily bypass subscription check for development
  return next();

  // Original subscription check
  console.log('Subscription check - User:', {
    id: req.user?.id,
    status: req.user?.subscriptionStatus
  });

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
  console.log('Registering routes...');

  // Initialize controllers
  const legalController = new LegalController();
  const documentsController = new DocumentsController();
  const chatController = new ChatController();
  const templatesController = new TemplatesController();

  // Set up authentication
  setupAuth(app);
  console.log('Auth setup completed');

  // API Version prefix
  const apiV1 = '/api/v1';

  // Public routes (no auth required)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Protected routes
  // Chat routes
  console.log('Registering chat routes...');
  app.post(`${apiV1}/sessions`, apiLimiter, chatLimiter, requireAuth, (req, res) => {
    console.log('Create session request received', { 
      userId: req.user?.id,
      sessionId: req.sessionID,
      body: req.body 
    });
    chatController.createSession(req, res);
  });

  app.get(`${apiV1}/sessions`, apiLimiter, requireAuth, (req, res) => {
    console.log('Get sessions request received', { 
      userId: req.user?.id,
      sessionId: req.sessionID 
    });
    chatController.getSessions(req, res);
  });

  app.get(`${apiV1}/sessions/:id`, apiLimiter, requireAuth, (req, res) => chatController.getSession(req, res));
  app.patch(`${apiV1}/sessions/:id`, apiLimiter, requireAuth, (req, res) => chatController.updateSession(req, res));
  app.delete(`${apiV1}/sessions/:id`, apiLimiter, requireAuth, (req, res) => chatController.deleteSession(req, res));
  app.put(`${apiV1}/sessions/:id/pin`, apiLimiter, requireAuth, (req, res) => chatController.togglePin(req, res));

  // Chat message routes (require active subscription for advanced features)
  app.post(`${apiV1}/sessions/:id/chat`, 
    apiLimiter,
    chatLimiter,
    requireAuth,
    requireActiveSubscription,
    (req, res, next) => {
      console.log('Add message request received', {
        userId: req.user?.id,
        sessionId: req.params.id,
        hasAttachments: req.files?.length > 0
      });
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

  // Legal routes (require active subscription)
  console.log('Registering legal routes...');
  app.get(`${apiV1}/legal/search`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => legalController.search(req, res));
  app.get(`${apiV1}/legal/statutes`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => legalController.getStatutes(req, res));
  app.get(`${apiV1}/legal/guidelines`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => legalController.getGuidelines(req, res));

  // Document routes
  app.get(`${apiV1}/documents/recent`, apiLimiter, requireAuth, (req, res) => documentsController.getRecent(req, res));
  app.get(`${apiV1}/documents/popular`, apiLimiter, requireAuth, (req, res) => documentsController.getPopular(req, res));
  app.get(`${apiV1}/documents/categories`, apiLimiter, requireAuth, (req, res) => documentsController.getCategories(req, res));

  // Template routes (require active subscription)
  app.get(`${apiV1}/templates`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => templatesController.getTemplates(req, res));
  app.get(`${apiV1}/templates/:id`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => templatesController.getTemplate(req, res));

  // Feedback and analysis routes
  app.post(`${apiV1}/sessions/:id/queries/:queryId/feedback`, apiLimiter, requireAuth, (req, res) => chatController.addFeedback(req, res));
  app.get(`${apiV1}/sessions/:id/analysis`, apiLimiter, requireAuth, requireActiveSubscription, (req, res) => chatController.getAnalysis(req, res));

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