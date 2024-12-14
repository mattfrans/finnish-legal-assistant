import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { apiLogger } from "./middleware/logger";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API logging middleware
app.use('/api', apiLogger);

// Version prefix middleware
app.use('/api', (req, _res, next) => {
  if (!req.path.startsWith('/v1/')) {
    req.url = `/v1${req.path}`;
  }
  next();
});

// Error handling
const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

(async () => {
  const server = registerRoutes(app);

  // Error handler should be after routes
  app.use(errorHandler);

  // Setup Vite for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`API Server running on http://0.0.0.0:${PORT}`);
    if (app.get("env") === "development") {
      log("Development mode: Vite middleware enabled");
    }
  });
})();
